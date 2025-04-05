import { Link } from "wouter";

interface QuickAccessTileProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  linkText: string;
  linkUrl: string;
  iconBgColor: string;
  linkBgColor: string;
  linkTextColor: string;
}

export default function QuickAccessTile({
  icon,
  title,
  description,
  linkText,
  linkUrl,
  iconBgColor,
  linkBgColor,
  linkTextColor,
}: QuickAccessTileProps) {
  return (
    <div className="bg-muted rounded-2xl border border-border overflow-hidden hover:border-border/80 transition-all duration-200">
      <div className="p-6 flex items-start space-x-4">
        <div className={`flex-shrink-0 h-12 w-12 rounded-full ${iconBgColor} border border-border flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="ml-auto">
          <Link href={linkUrl} className={`inline-flex items-center px-4 py-1.5 text-sm font-medium rounded-full ${linkTextColor} ${linkBgColor}`}>
            {linkText}
          </Link>
        </div>
      </div>
    </div>
  );
}
