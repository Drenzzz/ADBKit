import { useState } from 'react'
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog'
import { AlertDialog } from '@astryxdesign/core/AlertDialog'
import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import type { FileEntry } from '@/lib/types'

interface FileActionDialogsProps {
  dialogTargetFile: FileEntry | null
  selectedCount: number

  isPullDialogOpen: boolean
  isPushDialogOpen: boolean
  isRenameDialogOpen: boolean
  isDeleteDialogOpen: boolean
  isNewFolderDialogOpen: boolean
  isMoveDialogOpen: boolean
  isBatchPullDialogOpen: boolean
  isBatchDeleteDialogOpen: boolean

  setIsPullDialogOpen: (open: boolean) => void
  setIsPushDialogOpen: (open: boolean) => void
  setIsRenameDialogOpen: (open: boolean) => void
  setIsDeleteDialogOpen: (open: boolean) => void
  setIsNewFolderDialogOpen: (open: boolean) => void
  setIsMoveDialogOpen: (open: boolean) => void
  setIsBatchPullDialogOpen: (open: boolean) => void
  setIsBatchDeleteDialogOpen: (open: boolean) => void

  onPullConfirm: (localPath: string) => Promise<void>
  onPushConfirm: (localPath: string) => void
  onRenameConfirm: (newName: string) => void
  onDeleteConfirm: () => void
  onNewFolderConfirm: (folderName: string) => void
  onMoveConfirm: (destinationDir: string) => void
  onBatchPullConfirm: (localDir: string) => void
  onBatchDeleteConfirm: () => void

  chooseLocalFile: () => Promise<string>
  chooseLocalSaveFile: (defaultFilename: string) => Promise<string>
  chooseLocalDirectory: () => Promise<string>
}

export function FileActionDialogs({
  dialogTargetFile,
  selectedCount,
  isPullDialogOpen,
  isPushDialogOpen,
  isRenameDialogOpen,
  isDeleteDialogOpen,
  isNewFolderDialogOpen,
  isMoveDialogOpen,
  isBatchPullDialogOpen,
  isBatchDeleteDialogOpen,
  setIsPullDialogOpen,
  setIsPushDialogOpen,
  setIsRenameDialogOpen,
  setIsDeleteDialogOpen,
  setIsNewFolderDialogOpen,
  setIsMoveDialogOpen,
  setIsBatchPullDialogOpen,
  setIsBatchDeleteDialogOpen,
  onPullConfirm,
  onPushConfirm,
  onRenameConfirm,
  onDeleteConfirm,
  onNewFolderConfirm,
  onMoveConfirm,
  onBatchPullConfirm,
  onBatchDeleteConfirm,
  chooseLocalFile,
  chooseLocalSaveFile,
  chooseLocalDirectory,
}: FileActionDialogsProps) {
  const [renameValue, setRenameValue] = useState('')
  const [folderName, setFolderName] = useState('')
  const [moveValue, setMoveValue] = useState('')

  return (
    <>
      <Dialog isOpen={isPullDialogOpen} onOpenChange={setIsPullDialogOpen} width={448} padding={6}>
        <div className="grid gap-6">
          <DialogHeader
            onOpenChange={setIsPullDialogOpen}
            title={<span className="font-heading text-base leading-none font-medium">Export File</span>}
            subtitle={<span className="text-sm text-muted-foreground">Export this file from device to PC.</span>}
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setIsPullDialogOpen(false)} label="Cancel" />
            <Button variant="primary" onClick={async () => {
              const path = await chooseLocalSaveFile(dialogTargetFile?.name ?? 'exported-file')
              if (path) await onPullConfirm(path)
            }} label="Choose Location" />
          </div>
        </div>
      </Dialog>

      <Dialog isOpen={isPushDialogOpen} onOpenChange={setIsPushDialogOpen} width={448} padding={6}>
        <div className="grid gap-6">
          <DialogHeader
            onOpenChange={setIsPushDialogOpen}
            title={<span className="font-heading text-base leading-none font-medium">Import File</span>}
            subtitle={
              <span className="text-sm text-muted-foreground">
                Import a file to <span className="font-mono text-[13px]">{dialogTargetFile?.path}</span>
              </span>
            }
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setIsPushDialogOpen(false)} label="Cancel" />
            <Button variant="primary" onClick={async () => {
              const path = await chooseLocalFile()
              if (path) { onPushConfirm(path); setIsPushDialogOpen(false) }
            }} label="Choose File" />
          </div>
        </div>
      </Dialog>

      <Dialog isOpen={isRenameDialogOpen} onOpenChange={(open) => {
        setIsRenameDialogOpen(open)
        if (open && dialogTargetFile) setRenameValue(dialogTargetFile.name)
      }} width={448} padding={6}>
        <div className="grid gap-6">
          <DialogHeader
            onOpenChange={setIsRenameDialogOpen}
            title={<span className="font-heading text-base leading-none font-medium">Rename</span>}
            subtitle={<span className="text-sm text-muted-foreground">Rename {dialogTargetFile?.name}</span>}
          />
          <TextInput
            label="New name"
            isLabelHidden
            value={renameValue}
            onChange={(value) => setRenameValue(value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && renameValue.trim()) {
                onRenameConfirm(renameValue)
                setIsRenameDialogOpen(false)
              }
            }}
            hasAutoFocus
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setIsRenameDialogOpen(false)} label="Cancel" />
            <Button variant="primary" onClick={() => { onRenameConfirm(renameValue); setIsRenameDialogOpen(false) }} isDisabled={!renameValue.trim()} label="Rename" />
          </div>
        </div>
      </Dialog>

      <Dialog isOpen={isMoveDialogOpen} onOpenChange={(open) => {
        setIsMoveDialogOpen(open)
        if (open && dialogTargetFile) {
          const parent = dialogTargetFile.path.slice(0, dialogTargetFile.path.lastIndexOf('/')) || '/'
          setMoveValue(parent)
        }
      }} width={448} padding={6}>
        <div className="grid gap-6">
          <DialogHeader
            onOpenChange={setIsMoveDialogOpen}
            title={<span className="font-heading text-base leading-none font-medium">Move</span>}
            subtitle={
              <span className="text-sm text-muted-foreground">
                Move <span className="font-mono text-[13px]">{dialogTargetFile?.name}</span> to a destination directory on the device.
              </span>
            }
          />
          <TextInput
            label="Destination directory"
            isLabelHidden
            value={moveValue}
            onChange={(value) => setMoveValue(value)}
            placeholder="/sdcard/destination"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && moveValue.trim()) {
                onMoveConfirm(moveValue)
                setIsMoveDialogOpen(false)
              }
            }}
            hasAutoFocus
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setIsMoveDialogOpen(false)} label="Cancel" />
            <Button variant="primary" onClick={() => { onMoveConfirm(moveValue); setIsMoveDialogOpen(false) }} isDisabled={!moveValue.trim()} label="Move" />
          </div>
        </div>
      </Dialog>

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete File"
        description={`Delete ${dialogTargetFile?.name ?? ''}? This cannot be undone.`}
        actionLabel="Delete"
        actionVariant="destructive"
        onAction={onDeleteConfirm}
        width={448}
      />

      <Dialog isOpen={isNewFolderDialogOpen} onOpenChange={(open) => {
        setIsNewFolderDialogOpen(open)
        if (open) setFolderName('')
      }} width={448} padding={6}>
        <div className="grid gap-6">
          <DialogHeader
            onOpenChange={setIsNewFolderDialogOpen}
            title={<span className="font-heading text-base leading-none font-medium">New Folder</span>}
            subtitle={<span className="text-sm text-muted-foreground">Create a new folder in the current directory.</span>}
          />
          <TextInput
            label="Folder name"
            isLabelHidden
            value={folderName}
            onChange={(value) => setFolderName(value)}
            placeholder="Folder name"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && folderName.trim()) {
                onNewFolderConfirm(folderName)
                setIsNewFolderDialogOpen(false)
              }
            }}
            hasAutoFocus
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setIsNewFolderDialogOpen(false)} label="Cancel" />
            <Button variant="primary" onClick={() => { onNewFolderConfirm(folderName); setIsNewFolderDialogOpen(false) }} isDisabled={!folderName.trim()} label="Create" />
          </div>
        </div>
      </Dialog>

      <Dialog isOpen={isBatchPullDialogOpen} onOpenChange={setIsBatchPullDialogOpen} width={448} padding={6}>
        <div className="grid gap-6">
          <DialogHeader
            onOpenChange={setIsBatchPullDialogOpen}
            title={<span className="font-heading text-base leading-none font-medium">Export {selectedCount} File(s)</span>}
            subtitle={<span className="text-sm text-muted-foreground">Choose a directory on your computer to save the selected files.</span>}
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setIsBatchPullDialogOpen(false)} label="Cancel" />
            <Button variant="primary" onClick={async () => {
              const dir = await chooseLocalDirectory()
              if (dir) { onBatchPullConfirm(dir); setIsBatchPullDialogOpen(false) }
            }} label="Choose Directory" />
          </div>
        </div>
      </Dialog>

      <AlertDialog
        isOpen={isBatchDeleteDialogOpen}
        onOpenChange={setIsBatchDeleteDialogOpen}
        title={`Delete ${selectedCount} File(s)`}
        description="This will permanently delete the selected files from the device. This cannot be undone."
        actionLabel="Delete All"
        actionVariant="destructive"
        onAction={onBatchDeleteConfirm}
        width={448}
      />
    </>
  )
}
