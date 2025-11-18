type JsonLdDisplayProps = {
  schema: object;
};

/**
 * A component for displaying JSON-LD schema in a formatted <pre> tag.
 * Useful for showing structured data for SEO purposes.
 * @param {JsonLdDisplayProps} props - The props for the component.
 */
export function JsonLdDisplay({ schema }: JsonLdDisplayProps) {
  return (
    <div className="relative">
      <pre className="text-sm bg-secondary/50 p-4 rounded-lg overflow-x-auto">
        <code className="font-code text-foreground">
          {JSON.stringify(schema, null, 2)}
        </code>
      </pre>
    </div>
  );
}

    