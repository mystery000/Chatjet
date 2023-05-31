import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  SortingState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { track } from '@vercel/analytics';
import cn from 'classnames';
import dayjs from 'dayjs';
// Cf. https://github.com/iamkun/dayjs/issues/297#issuecomment-1202327426
import relativeTime from 'dayjs/plugin/relativeTime';
import { MoreHorizontal, Globe, Upload } from 'lucide-react';
import dynamic from 'next/dynamic';
import { FC, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { isPresent } from 'ts-is-present';

import ConfirmDialog from '@/components/dialogs/Confirm';
import { FileDnd } from '@/components/files/FileDnd';
import StatusMessage from '@/components/files/StatusMessage';
import { UpgradeNote } from '@/components/files/UpgradeNote';
import * as GitHub from '@/components/icons/GitHub';
import { MotifIcon } from '@/components/icons/Motif';
import { ProjectSettingsLayout } from '@/components/layouts/ProjectSettingsLayout';
import Button from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { deleteFiles, deleteSource } from '@/lib/api';
import { useTrainingContext } from '@/lib/context/training';
import useFiles from '@/lib/hooks/use-files';
import useProject from '@/lib/hooks/use-project';
import useSources from '@/lib/hooks/use-sources';
import useTeam from '@/lib/hooks/use-team';
import useUsage from '@/lib/hooks/use-usage';
import {
  getFileNameForSourceAtPath,
  getIconForSource,
  getLabelForSource,
  getUrlPath,
  isUrl,
  pluralize,
} from '@/lib/utils';
import { Project, Source } from '@/types/types';

dayjs.extend(relativeTime);

const GitHubAddSourceDialog = dynamic(
  () => import('@/components/dialogs/sources/GitHub'),
  {
    loading: () => <p className="p-4 text-sm text-neutral-500">Loading...</p>,
  },
);

const MotifAddSourceDialog = dynamic(
  () => import('@/components/dialogs/sources/Motif'),
  {
    loading: () => <p className="p-4 text-sm text-neutral-500">Loading...</p>,
  },
);

const WebsiteAddSourceDialog = dynamic(
  () => import('@/components/dialogs/sources/Website'),
  {
    loading: () => <p className="p-4 text-sm text-neutral-500">Loading...</p>,
  },
);

const FilesAddSourceDialog = dynamic(
  () => import('@/components/dialogs/sources/Files'),
  {
    loading: () => <p className="p-4 text-sm text-neutral-500">Loading...</p>,
  },
);

const getBasePath = (pathWithFile: string) => {
  if (isUrl(pathWithFile)) {
    return getUrlPath(pathWithFile);
  }

  if (!pathWithFile.includes('/')) {
    return '/';
  }

  const parts = pathWithFile.split('/');
  if (parts.length <= 2 && pathWithFile.startsWith('/')) {
    return '/';
  } else {
    return parts.slice(0, -1).join('/').replace(/^\//, '');
  }
};

type SourceItemProps = {
  source: Source;
  onRemoveSelected: () => void;
};

const SourceItem: FC<SourceItemProps> = ({ source, onRemoveSelected }) => {
  const Icon = getIconForSource(source.type);
  return (
    <div className="flex w-full cursor-default flex-row items-center gap-2 text-sm">
      <Icon className="h-4 w-4 flex-none text-neutral-500" />
      <p className="flex-grow overflow-hidden text-neutral-500">
        {getLabelForSource(source)}
      </p>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex-none select-none p-1 text-neutral-500 opacity-50 outline-none transition hover:opacity-100"
            aria-label="Source options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="animate-menu-up dropdown-menu-content mr-2 min-w-[160px]"
            sideOffset={5}
          >
            <DropdownMenu.Item asChild onSelect={() => onRemoveSelected()}>
              <span className="dropdown-menu-item dropdown-menu-item-noindent block">
                Remove
              </span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

type RemoveSourceDialogProps = {
  projectId: Project['id'];
  source: Source;
  onComplete: () => void;
};

const RemoveSourceDialog: FC<RemoveSourceDialogProps> = ({
  projectId,
  source,
  onComplete,
}) => {
  const { mutate: mutateFiles } = useFiles();
  const { mutate: mutateSources } = useSources();
  const [loading, setLoading] = useState(false);

  return (
    <ConfirmDialog
      title={`Remove ${getLabelForSource(source)}?`}
      description={<>All associated files and training data will be deleted.</>}
      cta="Remove"
      variant="danger"
      loading={loading}
      onCTAClick={async () => {
        setLoading(true);
        try {
          await deleteSource(projectId, source.id);
          await mutateSources();
          await mutateFiles();
          toast.success(
            `The source ${getLabelForSource(
              source,
            )} has been removed from the project.`,
          );
        } catch (e) {
          console.error(e);
          toast.error('Error deleting source.');
        } finally {
          setLoading(false);
          onComplete();
        }
      }}
    />
  );
};

const hasNonFileSources = (sources: Source[]) => {
  return sources.some(
    (s) => s.type !== 'api-upload' && s.type !== 'file-upload',
  );
};

const getNameForPath = (
  sources: Source[],
  sourceId: Source['id'],
  path: string,
) => {
  const source = sources.find((s) => s.id === sourceId);
  if (!source) {
    return path;
  }
  return getFileNameForSourceAtPath(source, path);
};

const Data = () => {
  const { team } = useTeam();
  const { project } = useProject();
  const { files, mutate: mutateFiles, loading: loadingFiles } = useFiles();
  const { sources } = useSources();
  const {
    stopGeneratingEmbeddings,
    state: trainingState,
    trainAllSources,
  } = useTrainingContext();
  const {
    numWebsitePagesInProject,
    numWebsitePagesPerProjectAllowance,
    mutate: mutateFileStats,
  } = useUsage();
  const [rowSelection, setRowSelection] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [sourceToRemove, setSourceToRemove] = useState<Source | undefined>(
    undefined,
  );
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'path', desc: false },
  ]);

  const columnHelper = createColumnHelper<{
    path: string;
    source_id: string;
    updated_at: string;
  }>();

  const columns: any = useMemo(
    () => [
      columnHelper.accessor((row) => row.path, {
        id: 'select',
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => {
          return (
            <Checkbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              indeterminate={row.getIsSomeSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
          );
        },
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor(
        (row) => ({ sourceId: row.source_id, path: row.path }),
        {
          id: 'name',
          header: () => <span>Name</span>,
          cell: (info) => {
            const sourcePath = info.getValue();
            return getNameForPath(
              sources,
              sourcePath.sourceId,
              sourcePath.path,
            );
          },
          footer: (info) => info.column.id,
          sortingFn: (rowA, rowB, columnId) => {
            const valueA: { sourceId: Source['id']; path: string } =
              rowA.getValue(columnId);
            const valueB: { sourceId: Source['id']; path: string } =
              rowB.getValue(columnId);
            const nameA = getNameForPath(sources, valueA.sourceId, valueA.path);
            const nameB = getNameForPath(sources, valueB.sourceId, valueB.path);
            return nameA.localeCompare(nameB);
          },
        },
      ),
      columnHelper.accessor((row) => row.path, {
        id: 'path',
        header: () => <span>Path</span>,
        cell: (info) => (
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <div className="cursor-default truncate">
                  {getBasePath(info.getValue())}
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="tooltip-content">
                  {getBasePath(info.getValue())}
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        ),
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor((row) => row.source_id, {
        id: 'source',
        header: () => <span>Source</span>,
        cell: (info) => {
          const value = info.getValue();
          const source = sources.find((s) => s.id === value);
          if (source) {
            return getLabelForSource(source);
          } else {
            return '';
          }
        },
        footer: (info) => info.column.id,
      }),
      columnHelper.accessor((row) => row.updated_at, {
        id: 'updated',
        header: () => <span>Updated</span>,
        cell: (info) => dayjs(info.getValue()).fromNow(),
        footer: (info) => info.column.id,
      }),
    ],
    [columnHelper],
  );

  const table = useReactTable({
    data: files || [],
    columns,
    state: { rowSelection, sorting },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const numSelected = Object.values(rowSelection).filter(Boolean).length;
  const hasFiles = files && files.length > 0;
  const canTrain = hasFiles || hasNonFileSources(sources);
  const canAddMoreWebsitePages =
    !team ||
    numWebsitePagesPerProjectAllowance === 'unlimited' ||
    numWebsitePagesInProject < numWebsitePagesPerProjectAllowance;

  return (
    <ProjectSettingsLayout
      title="Data"
      width="xl"
      RightHeading={() => (
        <div className="flex w-full items-center gap-4">
          <div className="flex-grow" />
          <StatusMessage
            trainingState={trainingState}
            isDeleting={isDeleting}
            numFiles={files?.length || 0}
            numSelected={numSelected}
            playgroundPath={`/${team?.slug}/${project?.slug}/playground`}
          />
          {trainingState.state !== 'idle' && (
            <p
              className={cn('whitespace-nowrap text-xs text-neutral-500', {
                'subtle-underline cursor-pointer':
                  trainingState.state !== 'cancel_requested',
              })}
              onClick={stopGeneratingEmbeddings}
            >
              {trainingState.state === 'cancel_requested'
                ? 'Cancelling...'
                : 'Stop training'}
            </p>
          )}
          {numSelected > 0 && (
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <Button loading={isDeleting} variant="danger" buttonSize="sm">
                  Delete
                </Button>
              </Dialog.Trigger>
              <ConfirmDialog
                title={`Delete ${pluralize(numSelected, 'file', 'files')}?`}
                description="Deleting a file will remove it from all future answers."
                cta="Delete"
                variant="danger"
                loading={isDeleting}
                onCTAClick={async () => {
                  if (!project?.id) {
                    return;
                  }
                  const selectedRowIndices = Object.keys(rowSelection);
                  const rowModel = table.getSelectedRowModel().rowsById;
                  const fileIds = selectedRowIndices
                    .map((i) => rowModel[i].original.id)
                    .filter(isPresent);
                  if (fileIds.length === 0) {
                    return;
                  }
                  setIsDeleting(true);
                  await deleteFiles(project.id, fileIds);
                  await mutateFiles(
                    files?.filter((f) => !fileIds.includes(f.id)),
                  );
                  setRowSelection([]);
                  setIsDeleting(false);
                  mutateFileStats();
                  toast.success(
                    `${pluralize(fileIds.length, 'file', 'files')} deleted.`,
                  );
                }}
              />
            </Dialog.Root>
          )}
          {numSelected === 0 && canTrain && (
            <div className="flex flex-row items-center gap-2">
              <Button
                loading={
                  trainingState.state === 'loading' ||
                  trainingState.state === 'fetching_data'
                }
                variant="cta"
                buttonSize="sm"
                onClick={async () => {
                  track('start training');
                  await trainAllSources(
                    () => {
                      mutateFiles();
                    },
                    (message: string) => {
                      toast.error(message);
                    },
                  );
                  await mutateFiles();
                  toast.success('Processing complete.');
                }}
              >
                Train
              </Button>
            </div>
          )}
        </div>
      )}
    >
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-4">
        <div className="flex w-full flex-col gap-2">
          {!loadingFiles && !canAddMoreWebsitePages && (
            <UpgradeNote className="mb-4">
              You have reached your quota of indexed website pages (
              {numWebsitePagesPerProjectAllowance}) for this plan. Please
              upgrade your plan to index more website pages.
            </UpgradeNote>
          )}
          {sources.length > 0 && (
            <>
              <p className="text-xs font-medium text-neutral-500">Sources</p>
              <div className="mb-2 flex flex-col gap-2 pt-1 pb-4">
                {sources.map((source) => {
                  return (
                    <SourceItem
                      key={source.id}
                      source={source}
                      onRemoveSelected={() => {
                        setSourceToRemove(source);
                      }}
                    />
                  );
                })}
              </div>
            </>
          )}
          <div className="flex flex-col gap-2 rounded-md border border-dashed border-neutral-800 p-4">
            <GitHubAddSourceDialog>
              <button className="flex flex-row items-center gap-2 text-left text-sm text-neutral-500 outline-none transition hover:text-neutral-400">
                <GitHub.GitHubIcon className="h-4 w-4 flex-none" />
                <span className="truncate">Connect GitHub repo</span>
              </button>
            </GitHubAddSourceDialog>
            <MotifAddSourceDialog>
              <button className="flex flex-row items-center gap-2 text-left text-sm text-neutral-500 outline-none transition hover:text-neutral-400">
                <MotifIcon className="h-4 w-4 flex-none" />
                <span className="truncate">Connect Motif project</span>
              </button>
            </MotifAddSourceDialog>
            <WebsiteAddSourceDialog>
              <button
                className={cn(
                  'flex flex-row items-center gap-2 text-left text-sm text-neutral-500 outline-none transition hover:text-neutral-400',
                  {
                    'pointer-events-none opacity-50': !canAddMoreWebsitePages,
                  },
                )}
              >
                <Globe className="h-4 w-4 flex-none" />
                <span className="truncate">Connect website</span>
              </button>
            </WebsiteAddSourceDialog>
            <FilesAddSourceDialog>
              <button className="flex flex-row items-center gap-2 text-left text-sm text-neutral-500 outline-none transition hover:text-neutral-400">
                <Upload className="h-4 w-4 flex-none" />
                <span className="truncate">Upload files</span>
              </button>
            </FilesAddSourceDialog>
          </div>
        </div>
        {!loadingFiles && !hasFiles && (
          <div className="h-[400px] rounded-lg border border-dashed border-neutral-800 bg-neutral-1100 sm:col-span-3">
            <FileDnd
              onTrainingComplete={() => {
                toast.success('Processing complete.');
              }}
            />
          </div>
        )}
        {hasFiles && (
          <div className="sm:col-span-3">
            <table className="w-full max-w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[32px]" />
                <col className="w-[calc(50%-172px)]" />
                <col className="w-[30%]" />
                <col className="w-[20%]" />
                <col className="w-[140px]" />
              </colgroup>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-neutral-800"
                  >
                    {headerGroup.headers.map((header) => {
                      return (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          className="cursor-pointer py-2 px-2 text-left text-sm text-neutral-300"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder ? null : (
                            <div className="flex flex-row items-center gap-2">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {header.id !== 'select' && (
                                <>
                                  <span className="text-sm font-normal text-neutral-600">
                                    {{
                                      asc: '↓',
                                      desc: '↑',
                                    }[header.column.getIsSorted() as string] ??
                                      null}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-b border-neutral-900 hover:bg-neutral-1000',
                        {
                          'bg-neutral-1000': row.getIsSelected(),
                        },
                      )}
                    >
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <td
                            key={cell.id}
                            style={{
                              width: 100,
                            }}
                            className={cn(
                              'overflow-hidden truncate text-ellipsis whitespace-nowrap py-2 px-2 text-sm',
                              {
                                'font-medium text-neutral-300':
                                  cell.column.id === 'name',
                                'text-neutral-500':
                                  cell.column.id === 'path' ||
                                  cell.column.id === 'source' ||
                                  cell.column.id === 'updated',
                              },
                            )}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Dialog.Root
        open={!!sourceToRemove}
        onOpenChange={() => setSourceToRemove(undefined)}
      >
        {sourceToRemove && project && (
          <RemoveSourceDialog
            projectId={project.id}
            source={sourceToRemove}
            onComplete={() => setSourceToRemove(undefined)}
          />
        )}
      </Dialog.Root>
    </ProjectSettingsLayout>
  );
};

export default Data;
