import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Quote, AlertCircle } from "lucide-react";

interface QuoteData {
  content: string;
  author: string;
}

export default function QuoteCard() {
  const { data: quote, isLoading, isError } = useQuery<QuoteData>({
    queryKey: ["daily-quote"],
    // Use our backend endpoint instead
    queryFn: async () => {
      const res = await fetch("/api/daily-quote");
      if (!res.ok) {
        throw new Error('Failed to fetch quote');
      }
      return res.json();
    },
    // Cache the quote for 24 hours so it only changes once per day
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 3
  });

  if (isError) {
    return (
      <Card className="bg-destructive/10">
        <CardContent className="p-6 flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-destructive">Failed to load today's quote. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-6 space-y-4">
        <Quote className="h-8 w-8 text-primary/40" />
        <div className="pl-4 border-l-2 border-primary/20">
          <p className="text-lg font-serif italic text-foreground/90">
            {quote?.content}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            — {quote?.author}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}