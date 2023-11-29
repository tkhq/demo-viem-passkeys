import type { NextApiRequest, NextApiResponse } from "next";
import { TurnkeyApiTypes, TurnkeyClient } from "@turnkey/http";
import { createActivityPoller } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { refineNonNull } from "@/utils";
import { TWalletDetails } from "@/types";

type TAttestation = TurnkeyApiTypes["v1Attestation"];

type CreateSubOrgWithPrivateKeyRequest = {
  subOrgName: string;
  challenge: string;
  privateKeyName: string;
  attestation: TAttestation;
};

type ErrorMessage = {
  message: string;
};

// Default path for the first Ethereum address in a new HD wallet.
// See https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki, paths are in the form:
//     m / purpose' / coin_type' / account' / change / address_index
// - Purpose is a constant set to 44' following the BIP43 recommendation.
// - Coin type is set to 60 (ETH) -- see https://github.com/satoshilabs/slips/blob/master/slip-0044.md
// - Account, Change, and Address Index are set to 0
const ETHEREUM_WALLET_DEFAULT_PATH = "m/44'/60'/0'/0/0";

export default async function createUser(
  req: NextApiRequest,
  res: NextApiResponse<TWalletDetails | ErrorMessage>
) {
  const createSubOrgRequest = req.body as CreateSubOrgWithPrivateKeyRequest;

  try {
    const turnkeyClient = new TurnkeyClient(
      { baseUrl: process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL! },
      new ApiKeyStamper({
        apiPublicKey: process.env.API_PUBLIC_KEY!,
        apiPrivateKey: process.env.API_PRIVATE_KEY!,
      })
    );

    const activityPoller = createActivityPoller({
      client: turnkeyClient,
      requestFn: turnkeyClient.createSubOrganization,
    });

    const walletName = `Default ETH Wallet`;

    const completedActivity = await activityPoller({
      type: "ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION_V4",
      timestampMs: String(Date.now()),
      organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
      parameters: {
        subOrganizationName: createSubOrgRequest.subOrgName,
        rootQuorumThreshold: 1,
        rootUsers: [
          {
            userName: "New user",
            apiKeys: [],
            authenticators: [
              {
                authenticatorName: "Passkey",
                challenge: createSubOrgRequest.challenge,
                attestation: createSubOrgRequest.attestation,
              },
            ],
          },
        ],
        wallet: {
          walletName: walletName,
          accounts: [
            {
              curve: "CURVE_SECP256K1",
              pathFormat: "PATH_FORMAT_BIP32",
              path: ETHEREUM_WALLET_DEFAULT_PATH,
              addressFormat: "ADDRESS_FORMAT_ETHEREUM",
            }
          ]
        },
      },
    });

    const subOrgId = refineNonNull(
      completedActivity.result.createSubOrganizationResultV4?.subOrganizationId
    );
    const wallet = refineNonNull(
      completedActivity.result.createSubOrganizationResultV4?.wallet
    );
    const walletId = wallet.walletId;
    const walletAddress = wallet.addresses[0]

    res.status(200).json({
      id: walletId,
      address: walletAddress,
      subOrgId: subOrgId,
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      message: "Something went wrong.",
    });
  }
}
