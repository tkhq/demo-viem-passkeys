import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  TSignedRequest,
  TurnkeyClient,
} from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";
import { THttpError, TWalletDetails } from "@/types";


export default async function login(
  req: NextApiRequest,
  res: NextApiResponse<TWalletDetails|THttpError>
) {
  // This signed request is a signed whoami request, coming from the frontend, signed by the end-user's passkey.
  let signedRequest = req.body as TSignedRequest;

  try {
    const whoamiResponse = await axios.post(
      signedRequest.url,
      signedRequest.body,
      {
        headers: {
          [signedRequest.stamp.stampHeaderName]:
            signedRequest.stamp.stampHeaderValue,
        },
      }
    );

    if (whoamiResponse.status !== 200) {
      res.status(500).json({
        message: `expected 200 when forwarding signed whoami request, got ${whoamiResponse.status}: ${whoamiResponse.data}`,
      });
    }

    const subOrgId = whoamiResponse.data.organizationId;

    const stamper = new ApiKeyStamper({
      apiPublicKey: process.env.API_PUBLIC_KEY!,
      apiPrivateKey: process.env.API_PRIVATE_KEY!,
    });
    const client = new TurnkeyClient(
      { baseUrl: process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL! },
      stamper
    );

    const walletsResponse = await client.getWallets({
        organizationId: subOrgId,
    });
    const accountsResponse = await client.getWalletAccounts({
    organizationId: subOrgId,
    walletId: walletsResponse.wallets[0].walletId,
    });
    const walletId = accountsResponse.accounts[0].walletId;
    const walletAddress = accountsResponse.accounts[0].address;
    
    res.status(200).json({
        id: walletId,
        address: walletAddress,
        subOrgId: subOrgId,
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      message: `Something went wrong, caught error: ${e}`,
    });
  }
}
