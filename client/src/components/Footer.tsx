export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-8">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center" data-testid="footer-logo">
            <img 
              src="/logo.svg" 
              alt="Caesar Forum" 
              className="h-6"
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            Een intern platform van{" "}
            <a
              href="https://caesar.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
              data-testid="link-caesar-nl"
            >
              Caesar.nl
            </a>
          </p>
          
          <p className="text-xs text-muted-foreground" data-testid="text-copyright">
            &copy; {new Date().getFullYear()} Caesar Groep
          </p>
        </div>
      </div>
    </footer>
  );
}
