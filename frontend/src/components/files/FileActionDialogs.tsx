import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
      <Dialog open={isPullDialogOpen} onOpenChange={setIsPullDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export File</DialogTitle>
            <DialogDescription>
              Export this file from device to PC.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsPullDialogOpen(false)} label="Cancel" />
            <Button variant="primary" onClick={async () => {
              const path = await chooseLocalSaveFile(dialogTargetFile?.name ?? 'exported-file')
              if (path) await onPullConfirm(path)
            }} label="Choose Location" />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPushDialogOpen} onOpenChange={setIsPushDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import File</DialogTitle>
            <DialogDescription>
              Import a file to <span className="font-mono text-[13px]">{dialogTargetFile?.path}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsPushDialogOpen(false)} label="Cancel" />
            <Button variant="primary" onClick={async () => {
              const path = await chooseLocalFile()
              if (path) { onPushConfirm(path); setIsPushDialogOpen(false) }
            }} label="Choose File" />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameDialogOpen} onOpenChange={(open) => {
        setIsRenameDialogOpen(open)
        if (open && dialogTargetFile) setRenameValue(dialogTargetFile.name)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>Rename {dialogTargetFile?.name}</DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsRenameDialogOpen(false)} label="Cancel" />
            <Button variant="primary" onClick={() => { onRenameConfirm(renameValue); setIsRenameDialogOpen(false) }} isDisabled={!renameValue.trim()} label="Rename" />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMoveDialogOpen} onOpenChange={(open) => {
        setIsMoveDialogOpen(open)
        if (open && dialogTargetFile) {
          const parent = dialogTargetFile.path.slice(0, dialogTargetFile.path.lastIndexOf('/')) || '/'
          setMoveValue(parent)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move</DialogTitle>
            <DialogDescription>
              Move <span className="font-mono text-[13px]">{dialogTargetFile?.name}</span> to a destination directory on the device.
            </DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsMoveDialogOpen(false)} label="Cancel" />
            <Button variant="primary" onClick={() => { onMoveConfirm(moveValue); setIsMoveDialogOpen(false) }} isDisabled={!moveValue.trim()} label="Move" />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-mono text-[13px]">{dialogTargetFile?.name}</span>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isNewFolderDialogOpen} onOpenChange={(open) => {
        setIsNewFolderDialogOpen(open)
        if (open) setFolderName('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription>Create a new folder in the current directory.</DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsNewFolderDialogOpen(false)} label="Cancel" />
            <Button variant="primary" onClick={() => { onNewFolderConfirm(folderName); setIsNewFolderDialogOpen(false) }} isDisabled={!folderName.trim()} label="Create" />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchPullDialogOpen} onOpenChange={setIsBatchPullDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export {selectedCount} File(s)</DialogTitle>
            <DialogDescription>Choose a directory on your computer to save the selected files.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsBatchPullDialogOpen(false)} label="Cancel" />
            <Button variant="primary" onClick={async () => {
              const dir = await chooseLocalDirectory()
              if (dir) { onBatchPullConfirm(dir); setIsBatchPullDialogOpen(false) }
            }} label="Choose Directory" />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} File(s)</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected files from the device. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onBatchDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
