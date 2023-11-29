import Image from "next/image";
import styles from "./index.module.css";
import { getWebAuthnAttestation, TurnkeyClient } from "@turnkey/http";
import { createAccount } from "@turnkey/viem";
import { useForm } from "react-hook-form";
import axios from "axios";
import { WebauthnStamper } from "@turnkey/webauthn-stamper";
import { useState } from "react";
import { createWalletClient, http } from "viem";
import { sepolia } from "viem/chains";
import { TWalletDetails } from "../types";

type subOrgFormData = {
  subOrgName: string;
};

type signingFormData = {
  messageToSign: string;
};

const generateRandomBuffer = (): ArrayBuffer => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return arr.buffer;
};

const base64UrlEncode = (challenge: ArrayBuffer): string => {
  return Buffer.from(challenge)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

type TWalletState = TWalletDetails | null;

type TSignedMessage = {
  message: string;
  signature: string;
} | null;

const humanReadableDateTime = (): string => {
  return new Date().toLocaleString().replaceAll("/", "-").replaceAll(":", ".");
};

export default function Home() {
  const [wallet, setWallet] = useState<TWalletState>(null);
  const [signedMessage, setSignedMessage] = useState<TSignedMessage>(null);

  const { handleSubmit: subOrgFormSubmit } = useForm<subOrgFormData>();
  const { register: signingFormRegister, handleSubmit: signingFormSubmit } =
    useForm<signingFormData>();
  const { register: _loginFormRegister, handleSubmit: loginFormSubmit } =
    useForm();

  const stamper = new WebauthnStamper({
    rpId: "localhost",
  });

  const passkeyHttpClient = new TurnkeyClient(
    {
      baseUrl: process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL!,
    },
    stamper
  );

  const signMessage = async (data: signingFormData) => {
    if (!wallet) {
      throw new Error("wallet not found");
    }

    const viemAccount = await createAccount({
      client: passkeyHttpClient,
      organizationId: wallet.subOrgId,
      signWith: wallet.address,
      ethereumAddress: wallet.address,
    });

    const viemClient = createWalletClient({
      account: viemAccount,
      chain: sepolia,
      transport: http(),
    });

    const signedMessage = await viemClient.signMessage({
      message: data.messageToSign,
    });

    setSignedMessage({
      message: data.messageToSign,
      signature: signedMessage,
    });
  };

  const createSubOrgAndWallet = async () => {
    const challenge = generateRandomBuffer();
    const subOrgName = `Turnkey Viem+Passkey Demo - ${humanReadableDateTime()}`;
    const authenticatorUserId = generateRandomBuffer();

    const attestation = await getWebAuthnAttestation({
      publicKey: {
        rp: {
          id: "localhost",
          name: "Turnkey Viem Passkey Demo",
        },
        challenge,
        pubKeyCredParams: [
          {
            type: "public-key",
            alg: -7,
          },
          {
            type: "public-key",
            alg: -257,
          },
        ],
        user: {
          id: authenticatorUserId,
          name: subOrgName,
          displayName: subOrgName,
        },
      },
    });

    const res = await axios.post("/api/createSubOrg", {
      subOrgName: subOrgName,
      attestation,
      challenge: base64UrlEncode(challenge),
    });

    const response = res.data as TWalletDetails;
    setWallet(response);
  };

  const login = async () => {
    try {
      // We use the parent org ID, which we know at all times...
      const signedRequest = await passkeyHttpClient.stampGetWhoami({
        organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID!,
      });
      // ...to get the sub-org ID, which we don't know at this point because we don't
      // have a DB. Note that we are able to perform this lookup by using the
      // credential ID from the users WebAuthn stamp.
      // In our login endpoint we also fetch wallet details after we get the sub-org ID
      // (our backend API key can do this: parent orgs have read-only access to their sub-orgs)
      const res = await axios.post("/api/login", signedRequest);
      if (res.status !== 200) {
        throw new Error(`error while logging in (${res.status}): ${res.data}`);
      }

      const response = res.data as TWalletDetails;
      setWallet(response);
    } catch (e: any) {
      const message = `caught error: ${e.toString()}`;
      console.error(message);
      alert(message);
    }
  };

  return (
    <main className={styles.main}>
      <a href="https://turnkey.com" target="_blank" rel="noopener noreferrer">
        <Image
          src="/logo.svg"
          alt="Turnkey Logo"
          className={styles.turnkeyLogo}
          width={100}
          height={24}
          priority
        />
      </a>
      <div>
        {wallet !== null && (
          <div className={styles.info}>
            Your sub-org ID: <br />
            <span className={styles.code}>{wallet.subOrgId}</span>
          </div>
        )}
        {wallet && (
          <div className={styles.info}>
            ETH address: <br />
            <span className={styles.code}>{wallet.address}</span>
          </div>
        )}
        {signedMessage && (
          <div className={styles.info}>
            Message: <br />
            <span className={styles.code}>{signedMessage.message}</span>
            <br />
            <br />
            Signature: <br />
            <span className={styles.code}>{signedMessage.signature}</span>
            <br />
            <br />
            <a
              href="https://etherscan.io/verifiedSignatures"
              target="_blank"
              rel="noopener noreferrer"
            >
              Verify with Etherscan
            </a>
          </div>
        )}
      </div>
      {!wallet && (
        <div>
          <h2>Create a new wallet</h2>
          <p className={styles.explainer}>
            We&apos;ll prompt your browser to create a new passkey. The details
            (credential ID, authenticator data, client data, attestation) will
            be used to create a new{" "}
            <a
              href="https://docs.turnkey.com/getting-started/sub-organizations"
              target="_blank"
              rel="noopener noreferrer"
            >
              Turnkey Sub-Organization
            </a>
            and a new{" "}
            <a
              href="https://docs.turnkey.com/getting-started/wallets"
              target="_blank"
              rel="noopener noreferrer"
            >
            Wallet
            </a> within it.
            <br />
            <br />
            This request to Turnkey will be created and signed by the backend
            API key pair.
          </p>
          <form
            className={styles.form}
            onSubmit={subOrgFormSubmit(createSubOrgAndWallet)}
          >
            <input
              className={styles.button}
              type="submit"
              value="Create new wallet"
            />
          </form>
          <br />
          <br />
          <h2>Already created your wallet? Log back in</h2>
          <p className={styles.explainer}>
            Based on the parent organization ID and a stamp from your passkey
            used to created the sub-organization and wallet, we can look up your
            sub-organization using the{" "}
            <a
              href="https://docs.turnkey.com/api#tag/Who-am-I"
              target="_blank"
              rel="noopener noreferrer"
            >
              Whoami endpoint.
            </a>
          </p>
          <form className={styles.form} onSubmit={loginFormSubmit(login)}>
            <input
              className={styles.button}
              type="submit"
              value="Login to sub-org with existing passkey"
            />
          </form>
        </div>
      )}
      {wallet !== null && (
        <div>
          <h2>Now let&apos;s sign something!</h2>
          <p className={styles.explainer}>
            We&apos;ll use a{" "}
            <a
              href="https://viem.sh/docs/accounts/custom.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Viem custom account
            </a>{" "}
            to do this, using{" "}
            <a
              href="https://www.npmjs.com/package/@turnkey/viem"
              target="_blank"
              rel="noopener noreferrer"
            >
              @turnkey/viem
            </a>
            . You can kill your NextJS server if you want, everything happens on
            the client-side!
          </p>
          <form
            className={styles.form}
            onSubmit={signingFormSubmit(signMessage)}
          >
            <input
              className={styles.input}
              {...signingFormRegister("messageToSign")}
              placeholder="Write something to sign..."
            />
            <input
              className={styles.button}
              type="submit"
              value="Sign Message"
            />
          </form>
        </div>
      )}
    </main>
  );
}
