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
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-6 flex items-start space-x-4">
        <div className={`flex-shrink-0 h-12 w-12 rounded-full ${iconBgColor} bg-opacity-20 flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-neutral-800">{title}</h3>
          <p className="mt-1 text-sm text-neutral-500">{description}</p>
        </div>
        <div className="ml-auto">
          <Link href={linkUrl}>
            <a className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-xl ${linkTextColor} ${linkBgColor} bg-opacity-10 hover:bg-opacity-20`}>
              {linkText}
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
