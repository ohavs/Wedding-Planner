import { cn } from '@/lib/utils'
import { initials } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: number
  ring?: boolean
  className?: string
}

/** תמונת פרופיל עם טבעת גרדיאנט בהשראת העיצוב */
export function Avatar({ src, name, size = 44, ring = true, className }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative shrink-0 rounded-full',
        ring && 'bg-gradient-to-br from-sun-300 to-coral p-[2.5px]',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={name ?? ''}
          referrerPolicy="no-referrer"
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-teal-500 font-bold text-white">
          {initials(name)}
        </div>
      )}
    </div>
  )
}
