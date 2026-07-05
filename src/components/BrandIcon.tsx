import { SiVolkswagen, SiAudi, SiPeugeot, SiFiat, SiHyundai, SiRenault } from "react-icons/si";

export function BrandIcon({ id, name, className = "" }: { id: string; name: string; className?: string }) {
  const props = { className: `w-12 h-12 ${className}` };
  
  switch (id) {
    case 'volkswagen': return <SiVolkswagen {...props} />;
    case 'audi': return <SiAudi {...props} />;
    case 'peugeot': return <SiPeugeot {...props} />;
    case 'fiat': return <SiFiat {...props} />;
    case 'hyundai': return <SiHyundai {...props} />;
    case 'renault': return <SiRenault {...props} />;
    default:
      return <span className={`text-2xl font-bold tracking-tight uppercase ${className}`}>{name}</span>;
  }
}
