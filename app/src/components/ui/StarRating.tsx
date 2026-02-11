import { Star } from 'lucide-react'

type StarRatingProps = {
  rating: number
  maxRating?: number
  size?: number
  className?: string
  showNumber?: boolean
  showCount?: boolean
  ratingCount?: number
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 5,
  className = '',
  showNumber = true,
  showCount = false,
  ratingCount,
}: StarRatingProps) {
  const roundedRating = Math.round(rating)
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1)

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {stars.map((star) => (
          <Star
            key={star}
            className={`h-${size} w-${size} ${
              star <= roundedRating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
      {showNumber && (
        <>
          <span className="font-bold">{rating}</span>
          {showCount && ratingCount !== undefined && (
            <span className="text-gray-400">({ratingCount})</span>
          )}
        </>
      )}
    </div>
  )
}
