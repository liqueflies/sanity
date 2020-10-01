import {DialogAction} from '@sanity/components'
import classNames from 'classnames'
import {useDocumentOperation} from '@sanity/react-hooks'
import PopoverDialog from 'part:@sanity/components/dialogs/popover'
import React, {useCallback, useContext, useState} from 'react'
import {undoChange} from '../changes/undoChange'
import {isFieldChange} from '../helpers'
import {isPTSchemaType} from '../../types/portableText/diff'
import {GroupChangeNode, OperationsAPI} from '../../types'
import {useHover} from '../../utils/useHover'
import {pathsAreEqual} from '../../paths'
import {DiffContext} from '../contexts/DiffContext'
import {ChangeBreadcrumb} from './ChangeBreadcrumb'
import {ChangeResolver} from './ChangeResolver'
import {DocumentChangeContext} from './DocumentChangeContext'
import {RevertChangesButton} from './RevertChangesButton'

import styles from './GroupChange.css'

export function GroupChange({change: group}: {change: GroupChangeNode}): React.ReactElement {
  const {titlePath, changes, path: groupPath} = group
  const {path: diffPath} = useContext(DiffContext)
  const {documentId, schemaType, FieldWrapper, rootDiff, isComparingCurrent} = useContext(
    DocumentChangeContext
  )

  const isPortableText = changes.every(
    change => isFieldChange(change) && isPTSchemaType(change.schemaType)
  )

  const isNestedInDiff = pathsAreEqual(diffPath, groupPath)
  const [hoverRef, isHoveringRevert] = useHover<HTMLDivElement>()
  const docOperations = useDocumentOperation(documentId, schemaType.name) as OperationsAPI
  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false)
  const [revertContainerElement, setRevertContainerElement] = useState<HTMLDivElement | null>(null)

  const handleRevertChanges = useCallback(() => undoChange(group, rootDiff, docOperations), [
    group,
    rootDiff,
    docOperations
  ])

  const handleRevertChangesConfirm = useCallback(() => {
    setConfirmRevertOpen(true)
  }, [])

  const closeRevertChangesConfirmDialog = useCallback(() => {
    setConfirmRevertOpen(false)
  }, [])

  const handleConfirmDialogAction = useCallback((action: DialogAction) => {
    if (action.action) action.action()
  }, [])

  const setRevertContainerRef = useCallback(
    (el: HTMLDivElement | null) => {
      hoverRef.current = el
      setRevertContainerElement(el)
    },
    [hoverRef]
  )

  const content = (
    <div className={isHoveringRevert ? styles.contentOutlined : styles.content}>
      <div className={styles.changeList}>
        {changes.map(change => (
          <ChangeResolver key={change.key} change={change} />
        ))}
      </div>

      {isComparingCurrent && (
        <>
          <div ref={setRevertContainerRef} className={styles.revertChangesButtonContainer}>
            <RevertChangesButton
              onClick={handleRevertChangesConfirm}
              selected={confirmRevertOpen}
            />
          </div>

          {confirmRevertOpen && (
            <PopoverDialog
              actions={[
                {
                  color: 'danger',
                  action: handleRevertChanges,
                  title: 'Revert change'
                },
                {
                  kind: 'simple',
                  action: closeRevertChangesConfirmDialog,
                  title: 'Cancel'
                }
              ]}
              onAction={handleConfirmDialogAction}
              referenceElement={revertContainerElement}
              size="small"
            >
              Are you sure you want to revert the changes?
            </PopoverDialog>
          )}
        </>
      )}
    </div>
  )

  return (
    <div className={classNames(styles.groupChange, isPortableText && styles.portableText)}>
      <div className={styles.changeHeader}>
        <ChangeBreadcrumb titlePath={titlePath} />
      </div>
      {isNestedInDiff || !FieldWrapper ? (
        content
      ) : (
        <FieldWrapper path={group.path} hasHover={isHoveringRevert}>
          {content}
        </FieldWrapper>
      )}
    </div>
  )
}
