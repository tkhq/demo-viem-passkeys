import styles from "../pages/index.module.css";

interface ISignedMessage {
  signedMessage: {
    message: string;
    signature: string;
  };
}

export default function SignMessageOutput({ signedMessage }: ISignedMessage) {
  return (
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
  );
}
