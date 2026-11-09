declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    strokeWidth?: number;
    fill?: string;
  }
  export const Bell: FC<LucideProps>;
  export const Box: FC<LucideProps>;
  export const Boxes: FC<LucideProps>;
  export const Building2: FC<LucideProps>;
  export const CalendarDays: FC<LucideProps>;
  export const ChevronDown: FC<LucideProps>;
  export const CircleDollarSign: FC<LucideProps>;
  export const ClipboardList: FC<LucideProps>;
  export const Clock3: FC<LucideProps>;
  export const Coins: FC<LucideProps>;
  export const Command: FC<LucideProps>;
  export const CreditCard: FC<LucideProps>;
  export const Download: FC<LucideProps>;
  export const Eye: FC<LucideProps>;
  export const EyeOff: FC<LucideProps>;
  export const FileBarChart: FC<LucideProps>;
  export const FileText: FC<LucideProps>;
  export const Fullscreen: FC<LucideProps>;
  export const Gauge: FC<LucideProps>;
  export const HandCoins: FC<LucideProps>;
  export const Headphones: FC<LucideProps>;
  export const Landmark: FC<LucideProps>;
  export const LayoutDashboard: FC<LucideProps>;
  export const LogOut: FC<LucideProps>;
  export const Lock: FC<LucideProps>;
  export const Mail: FC<LucideProps>;
  export const Menu: FC<LucideProps>;
  export const MessageSquare: FC<LucideProps>;
  export const PackageCheck: FC<LucideProps>;
  export const PackagePlus: FC<LucideProps>;
  export const Percent: FC<LucideProps>;
  export const Plus: FC<LucideProps>;
  export const ReceiptText: FC<LucideProps>;
  export const RotateCcw: FC<LucideProps>;
  export const Search: FC<LucideProps>;
  export const Settings: FC<LucideProps>;
  export const ShoppingBag: FC<LucideProps>;
  export const ShoppingCart: FC<LucideProps>;
  export const Sparkles: FC<LucideProps>;
  export const TrendingDown: FC<LucideProps>;
  export const TrendingUp: FC<LucideProps>;
  export const TriangleAlert: FC<LucideProps>;
  export const Truck: FC<LucideProps>;
  export const UserPlus: FC<LucideProps>;
  export const Users: FC<LucideProps>;
  export const WalletCards: FC<LucideProps>;
  export const Warehouse: FC<LucideProps>;
  export const X: FC<LucideProps>;
  export const Zap: FC<LucideProps>;
}

declare module '@tailwindcss/vite' {
  import { Plugin } from 'vite';
  const plugin: () => Plugin;
  export default plugin;
}

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  import { FC, SVGProps } from 'react';
  const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  export { ReactComponent };
  const src: string;
  export default src;
}
