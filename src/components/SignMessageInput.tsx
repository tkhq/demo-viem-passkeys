import styles from "../pages/index.module.css";

interface SignMessageInputProps {
  onSubmit: (data: any) => void;
  registerInput: any;
}

export default function SignMessageInput({ onSubmit, registerInput }: SignMessageInputProps) {
  return (
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
        . You can kill your NextJS server if you want, everything happens on the
        client-side!
      </p>
      <form className={styles.form} onSubmit={onSubmit}>
        <input
          className={styles.input}
          {...registerInput}
          placeholder="Write something to sign..."
        />
        <input className={styles.button} type="submit" value="Sign Message" />
      </form>
    </div>
  );
}
