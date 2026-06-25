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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { FileEntry } from '@/lib/types'

interface FileActionDialogsProps {
  dialogTargetFile: FileEntry | null
  selectedCount: number

  isPullDialogOpen: boolean
  isPushDialogOpen: boolean
  isPushFolderDialogOpen: boolean
  isRenameDialogOpen: boolean
  isDeleteDialogOpen: boolean
  isNewFolderDialogOpen: boolean
  isMoveDialogOpen: boolean
  isBatchPullDialogOpen: boolean
  isBatchDeleteDialogOpen: boolean

  setIsPullDialogOpen: (open: boolean) => void
  setIsPushDialogOpen: (open: boolean) => void
  setIsPushFolderDialogOpen: (open: boolean) => void
  setIsRenameDialogOpen: (open: boolean) => void
  setIsDeleteDialogOpen: (open: boolean) => void
  setIsNewFolderDialogOpen: (open: boolean) => void
  setIsMoveDialogOpen: (open: boolean) => void
  setIsBatchPullDialogOpen: (open: boolean) => void
  setIsBatchDeleteDialogOpen: (open: boolean) => void

  onPullConfirm: (localPath: string) => void
  onPushConfirm: (localPath: string) => void
  onPushFolderConfirm: (localPath: string) => void
  onRenameConfirm: (newName: string) => void
  onDeleteConfirm: () => void
  onNewFolderConfirm: (folderName: string) => void
  onMoveConfirm: (destinationDir: string) => void
  onBatchPullConfirm: (localDir: string) => void
  onBatchDeleteConfirm: () => void

  chooseLocalFile: () => Promise<string>
  chooseLocalDirectory: () => Promise<string>
}

export function FileActionDialogs({
  dialogTargetFile,
  selectedCount,
  isPullDialogOpen,
  isPushDialogOpen,
  isPushFolderDialogOpen,
  isRenameDialogOpen,
  isDeleteDialogOpen,
  isNewFolderDialogOpen,
  isMoveDialogOpen,
  isBatchPullDialogOpen,
  isBatchDeleteDialogOpen,
  setIsPullDialogOpen,
  setIsPushDialogOpen,
  setIsPushFolderDialogOpen,
  setIsRenameDialogOpen,
  setIsDeleteDialogOpen,
  setIsNewFolderDialogOpen,
  setIsMoveDialogOpen,
  setIsBatchPullDialogOpen,
  setIsBatchDeleteDialogOpen,
  onPullConfirm,
  onPushConfirm,
  onPushFolderConfirm,
  onRenameConfirm,
  onDeleteConfirm,
  onNewFolderConfirm,
  onMoveConfirm,
  onBatchPullConfirm,
  onBatchDeleteConfirm,
  chooseLocalFile,
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
            <Button variant="outline" onClick={() => setIsPullDialogOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              const path = await chooseLocalFile()
              if (path) { onPullConfirm(path); setIsPullDialogOpen(false) }
            }}>Choose Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPushDialogOpen} onOpenChange={setIsPushDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import File</DialogTitle>
            <DialogDescription>
              Import a file to <span className="font-mono text-sm">{dialogTargetFile?.path}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPushDialogOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              const path = await chooseLocalFile()
              if (path) { onPushConfirm(path); setIsPushDialogOpen(false) }
            }}>Choose File</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPushFolderDialogOpen} onOpenChange={setIsPushFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Folder</DialogTitle>
            <DialogDescription>
              Import a folder from PC to this device directory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPushFolderDialogOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              const path = await chooseLocalDirectory()
              if (path) { onPushFolderConfirm(path); setIsPushFolderDialogOpen(false) }
            }}>Choose Folder</Button>
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
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && renameValue.trim()) {
                onRenameConfirm(renameValue)
                setIsRenameDialogOpen(false)
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { onRenameConfirm(renameValue); setIsRenameDialogOpen(false) }} disabled={!renameValue.trim()}>Rename</Button>
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
              Move <span className="font-mono text-sm">{dialogTargetFile?.name}</span> to a destination directory on the device.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={moveValue}
            onChange={(e) => setMoveValue(e.target.value)}
            placeholder="/sdcard/destination"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && moveValue.trim()) {
                onMoveConfirm(moveValue)
                setIsMoveDialogOpen(false)
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { onMoveConfirm(moveValue); setIsMoveDialogOpen(false) }} disabled={!moveValue.trim()}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-mono text-sm">{dialogTargetFile?.name}</span>? This cannot be undone.
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
          <Input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && folderName.trim()) {
                onNewFolderConfirm(folderName)
                setIsNewFolderDialogOpen(false)
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => { onNewFolderConfirm(folderName); setIsNewFolderDialogOpen(false) }} disabled={!folderName.trim()}>Create</Button>
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
            <Button variant="outline" onClick={() => setIsBatchPullDialogOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              const dir = await chooseLocalDirectory()
              if (dir) { onBatchPullConfirm(dir); setIsBatchPullDialogOpen(false) }
            }}>Choose Directory</Button>
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
