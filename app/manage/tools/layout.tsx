/** Tools on every plan (Alex, 2026-10-24): Cost to make, Price it, Is it worth it? and Describe it, each
 *  its own screen run on its own (Alex, 2026-10-28); the tabs across the top open them. */
export default function ToolsLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Tools</h1>
      </div>
      <main id="main" className="bk-content bk-tools">
        {children}
      </main>
    </>
  );
}
