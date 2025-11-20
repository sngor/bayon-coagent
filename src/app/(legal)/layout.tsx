import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b">
                <div className="container max-w-4xl py-4 px-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Bayon Coagent
                    </Link>
                </div>
            </header>
            <main>{children}</main>
            <footer className="border-t mt-16">
                <div className="container max-w-4xl py-8 px-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center text-sm text-muted-foreground">
                        <p>© {new Date().getFullYear()} Bayon Coagent. All rights reserved.</p>
                        <div className="flex gap-6">
                            <Link href="/privacy" className="hover:text-foreground transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="hover:text-foreground transition-colors">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
