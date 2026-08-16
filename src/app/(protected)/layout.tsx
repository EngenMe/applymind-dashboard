import { requireUser } from "@/lib/auth/session";
import { MainNav } from "@/components/main-nav";

/**
 * Wraps everything that needs a signed-in user: applications, cvs,
 * cover-letters, settings. Nothing outside this folder — the landing page,
 * /login, /register — goes through requireUser(), since none of those are
 * reachable meaningfully once you already require a session to see them.
 *
 * middleware.ts only checks that the session cookie exists, not that it's
 * still valid, because a Lambda round trip on every navigation is too slow to
 * put in front of every request. requireUser() is where the actual check
 * happens — once per render of this layout, not once per page inside it — and
 * it redirects to /login?expired=1 if the cookie turns out to be revoked or
 * expired.
 *
 * This is a nested layout, not the root one — it does not render <html> or
 * <body>, those stay in app/layout.tsx above it. Next composes the two
 * automatically because of where this file sits in the tree.
 */
export default async function ProtectedLayout({
                                                  children,
                                              }: {
    children: React.ReactNode;
}) {
    // Only used to gate the route — requireUser()'s server-side check is what
    // actually catches a revoked or expired cookie, MainNav's own client-side
    // useMe() is a separate, independent check for the button label. The two
    // don't need to share data; duplicating one cheap query is simpler than
    // threading a value between a server layout and a client component.
    await requireUser();

    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b border-rule px-4 py-3">
                <MainNav />
            </header>

            <main className="flex-1 px-4 py-6">{children}</main>
        </div>
    );
}