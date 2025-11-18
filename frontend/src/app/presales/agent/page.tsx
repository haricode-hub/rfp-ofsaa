// Existing presales agent page content
// This would contain the original presales upload and processing UI
// For now, placeholder to maintain routing

export default function PresalesAgentPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" asChild>
          <Link href="/presales">← Back to Presales Tools</Link>
        </Button>
        <h1 className="text-3xl font-bold">Presales Agent</h1>
      </div>
      {/* Insert existing presales component here */}
      <p className="text-muted-foreground">Presales Agent workflow (Excel RFP analysis and Oracle solution generation)</p>
      {/* Existing upload and processing UI */}
    </div>
  );
}