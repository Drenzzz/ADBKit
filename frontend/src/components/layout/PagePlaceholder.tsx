interface PagePlaceholderProps {
  title: string
  description: string
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="max-w-sm text-[14px] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
