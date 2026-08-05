interface ErrorBannerProps {
  message: string | null
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null
  return (
    <div className="banner-error" role="alert">
      {message}
    </div>
  )
}
