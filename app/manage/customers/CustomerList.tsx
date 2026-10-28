import type { ShopBuyer } from '@/lib/backend/buyers/queries';

const day = (iso: string): string => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));

/** Customers (Full): everyone with an account at her shop. Her switch for those
 *  accounts lives under My site (Alex, 2026-10-27). */
export function CustomerList({ customers }: { customers: readonly ShopBuyer[] }): React.ReactElement {
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Customers</h1>
      </div>
      <main id="main" className="bk-content">
        {customers.length === 0 ? (
          <p className="bk-note">No one has made an account yet. When a customer does, they show here.</p>
        ) : (
          <div className="bk-table-wrap">
            <table className="bk-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Orders</th>
                  <th scope="col">Spent</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
                      <a className="bk-link" href={`mailto:${c.email}`}>
                        {c.email}
                      </a>
                    </td>
                    <td>{day(c.joined)}</td>
                    <td>{c.orders}</td>
                    <td>{c.spent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
