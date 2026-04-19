import type { Metadata } from "next";
import { Shell, Container } from "@bluecup/ui";
import { AppChrome } from "../components/AppChrome";

export const metadata: Metadata = {
  title: "Las Marías Blue Cup — Live Leaderboard",
  description: "Public real-time leaderboard for the Las Marías Blue Cup"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" }}>
        <Shell>
          <Container>
            <AppChrome>{children}</AppChrome>
          </Container>
        </Shell>
      </body>
    </html>
  );
}

