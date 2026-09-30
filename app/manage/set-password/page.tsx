import SetPasswordForm from './SetPasswordForm';

export default function SetPasswordPage(): React.ReactElement {
  return (
    <>
      <div className="bk-head"><h1 className="bk-title">Set your password</h1></div>
      <main id="main" className="bk-content"><div className="bk-card"><SetPasswordForm /></div></main>
    </>
  );
}
