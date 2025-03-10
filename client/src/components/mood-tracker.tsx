import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mood } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MOOD_EMOJIS = ["😢", "😕", "😐", "🙂", "😊"];

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const { data: moods, isLoading } = useQuery<Mood[]>({
    queryKey: ["/api/moods"],
  });

  const createMoodMutation = useMutation({
    mutationFn: async (data: { rating: number; note?: string }) => {
      const res = await apiRequest("POST", "/api/moods", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moods"] });
      toast({
        title: "Mood tracked",
        description: "Your mood has been recorded successfully.",
      });
      setSelectedMood(null);
      setNote("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (selectedMood === null) return;
    createMoodMutation.mutate({
      rating: selectedMood,
      note: note.trim() || undefined,
    });
  };

  const chartData = moods?.map((mood) => ({
    date: new Date(mood.createdAt).toLocaleDateString(),
    rating: mood.rating,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-4">
        {MOOD_EMOJIS.map((emoji, index) => (
          <Button
            key={index}
            variant={selectedMood === index ? "default" : "outline"}
            className="text-2xl p-6"
            onClick={() => setSelectedMood(index)}
          >
            {emoji}
          </Button>
        ))}
      </div>

      <Textarea
        placeholder="Add a note about how you're feeling (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-24"
      />

      <Button
        onClick={handleSubmit}
        className="w-full"
        disabled={selectedMood === null || createMoodMutation.isPending}
      >
        {createMoodMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Tracking...
          </>
        ) : (
          "Track Mood"
        )}
      </Button>

      {isLoading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : moods?.length ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 4]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          No mood data available yet. Start tracking your mood!
        </p>
      )}
    </div>
  );
}
