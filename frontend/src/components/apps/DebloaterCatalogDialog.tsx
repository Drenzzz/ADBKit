import { IconDownload, IconFileCode, IconTrash, IconUpload } from '@tabler/icons-react'
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import type { DebloatCatalogMeta } from '@/lib/types'

interface DebloaterCatalogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meta: DebloatCatalogMeta | null
  onImport: () => void
  onExportTemplate: () => void
  onClearCustom: () => void
}

export function DebloaterCatalogDialog({
  open,
  onOpenChange,
  meta,
  onImport,
  onExportTemplate,
  onClearCustom,
}: DebloaterCatalogDialogProps) {
  const hasCustom = (meta?.customCount ?? 0) > 0

  return (
    <Dialog
      isOpen={open}
      onOpenChange={onOpenChange}
      width={520}
      padding={0}
      className="dashboard-scale overflow-hidden rounded-2xl"
    >
      <div className="px-7 pb-4 pt-7">
        <DialogHeader
          className="space-y-1.5 text-left"
          title={
            <span className="text-[20px] font-bold tracking-tight text-[var(--color-text-primary)]">
              Debloater Catalog
            </span>
          }
          subtitle={
            <span className="text-[14px] text-[var(--color-text-secondary)]">
              Manage built-in and custom JSON package definitions. Built-in critical bootloop protections cannot be overridden.
            </span>
          }
        />
      </div>

      <div className="space-y-4 px-7 pb-6">
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-xl bg-[var(--color-background-muted)]/60 p-3">
            <p className="text-[12px] text-[var(--color-text-secondary)]">Built-in</p>
            <p className="mt-0.5 text-[18px] font-bold tabular text-[var(--color-text-primary)]">
              {meta?.builtinCount ?? '-'}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-background-muted)]/60 p-3">
            <p className="text-[12px] text-[var(--color-text-secondary)]">Custom JSON</p>
            <p className="mt-0.5 text-[18px] font-bold tabular text-[var(--color-text-primary)]">
              {meta?.customCount ?? 0}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-background-muted)]/60 p-3">
            <p className="text-[12px] text-[var(--color-text-secondary)]">Protected</p>
            <p className="mt-0.5 text-[18px] font-bold tabular text-[var(--color-text-primary)]">
              {meta?.criticalCount ?? '-'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-[var(--color-background-muted)]/40 px-4 py-2.5 text-[13px]">
          <span className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <IconFileCode size={16} stroke={1.75} />
            Catalog version
          </span>
          <Badge variant="neutral" label={meta?.version ?? '2026.11.27'} />
        </div>

        <div className="rounded-xl bg-[var(--color-background-muted)]/40 p-3.5 text-[12px] text-[var(--color-text-secondary)]">
          <p className="font-semibold text-[var(--color-text-primary)]">Custom JSON schema</p>
          <code className="mt-1 block whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
            {`{ "packages": [{ "packageName": "com.example.app", "appName": "Example", "vendor": "third-party", "category": "Partner Preloads", "risk": "safe", "description": "Optional note" }] }`}
          </code>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            variant="primary"
            icon={<IconUpload size={16} stroke={1.75} />}
            label="Import Custom JSON"
            onClick={onImport}
          />
          <Button
            variant="secondary"
            icon={<IconDownload size={16} stroke={1.75} />}
            label="Export Template"
            onClick={onExportTemplate}
          />
          {hasCustom && (
            <Button
              variant="ghost"
              icon={<IconTrash size={16} stroke={1.75} />}
              label="Reset Custom"
              onClick={onClearCustom}
            />
          )}
        </div>
      </div>
    </Dialog>
  )
}
