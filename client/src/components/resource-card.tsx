import { Resource } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Video, Link as LinkIcon } from "lucide-react";

interface ResourceCardProps {
  resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const getIcon = () => {
    switch (resource.type.toLowerCase()) {
      case "pdf":
        return <FileText className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      default:
        return <LinkIcon className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-4">
        <div className="bg-primary/10 p-2 rounded">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{resource.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
          <Button
            variant="link"
            className="px-0 h-auto mt-2"
            asChild
          >
            <a href={resource.url} target="_blank" rel="noopener noreferrer">
              Access Resource
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
