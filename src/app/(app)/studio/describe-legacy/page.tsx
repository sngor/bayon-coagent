
import { ListingDescriptionGeneratorForm } from '@/components/listing-description-generator/listing-description-generator-form';
import { Card, CardHeader } from '@/components/ui/card';

export default function ListingDescriptionGeneratorPage() {
  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-headline">Listing Description Generator</h1>
              <p className="text-muted-foreground">Generate compelling real estate listing descriptions from property data.</p>
            </div>
          </div>
        </CardHeader>
      </Card>
      <ListingDescriptionGeneratorForm />
    </div>
  );
}
