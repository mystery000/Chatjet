import * as Dialog from '@radix-ui/react-dialog';
import { track } from '@vercel/analytics';
import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  FormikErrors,
  FormikValues,
} from 'formik';
import Link from 'next/link';
import { ChangeEvent, FC, ReactNode, useState } from 'react';
import { toast } from 'react-hot-toast';

import Button from '@/components/ui/Button';
import { ErrorLabel } from '@/components/ui/Forms';
import { NoAutoInput } from '@/components/ui/Input';
import { addSource, deleteSource } from '@/lib/api';
import useProject from '@/lib/hooks/use-project';
import useSources from '@/lib/hooks/use-sources';
import useTeam from '@/lib/hooks/use-team';
import useUser from '@/lib/hooks/use-user';
import {
  extractProjectDomain,
  isMotifProjectAccessible,
} from '@/lib/integrations/motif';
import { getLabelForSource } from '@/lib/utils';
import { Project } from '@/types/types';

const _addSource = async (
  projectId: Project['id'],
  projectDomain: string,
  mutate: () => void,
) => {
  try {
    const newSource = await addSource(projectId, 'motif', {
      projectDomain,
    });
    await mutate();
    toast.success(
      `The source ${getLabelForSource(
        newSource,
      )} has been added to the project`,
    );
  } catch (e) {
    console.error(e);
    toast.error(`${e}`);
  }
};

type MotifSourceProps = {
  clearPrevious?: boolean;
  onDidAddSource: () => void;
};

const MotifSource: FC<MotifSourceProps> = ({
  clearPrevious,
  onDidAddSource,
}) => {
  const { project } = useProject();
  const { user } = useUser();
  const { sources, mutate } = useSources();
  const [projectDomain, setProjectDomain] = useState('');

  if (!user) {
    return <></>;
  }

  return (
    <>
      <Formik
        initialValues={{ projectDomain: '' }}
        validateOnBlur
        onSubmit={async (_values, { setSubmitting, setErrors }) => {
          if (!project || !projectDomain) {
            return;
          }

          const isAccessible = await isMotifProjectAccessible(projectDomain);

          if (!isAccessible) {
            const errors: FormikErrors<FormikValues> = {
              projectDomain: 'Project is not accessible',
            };
            setErrors(errors);
            return;
          }

          setSubmitting(true);
          if (clearPrevious) {
            for (const source of sources) {
              await deleteSource(project.id, source.id);
            }
          }
          track('connect motif project');
          await _addSource(project.id, projectDomain, mutate);
          setSubmitting(false);
          onDidAddSource();
        }}
      >
        {({ isSubmitting, isValid }) => (
          <Form className="h-full flex-grow">
            <div className="flex h-full flex-grow flex-col gap-2">
              <div className="h-flex-none mt-4 flex flex-col gap-1 px-4 pb-8">
                <p className="mb-1 flex-none text-sm font-medium text-neutral-300">
                  Project URL
                </p>
                <div className="flex flex-none flex-row gap-2">
                  <Field
                    wrapperClassName="flex-grow"
                    type="text"
                    name="projectDomain"
                    inputSize="sm"
                    as={NoAutoInput}
                    disabled={isSubmitting}
                    rightAccessory=".motif.land"
                    value={projectDomain}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setProjectDomain(event.target.value);
                    }}
                    onPaste={(event: ClipboardEvent) => {
                      event.preventDefault();

                      const pastedText = event.clipboardData?.getData('text');
                      let newValue = pastedText || '';
                      if (pastedText) {
                        const _projectDomain = extractProjectDomain(pastedText);
                        if (_projectDomain) {
                          newValue = _projectDomain;
                        }
                      }

                      setProjectDomain(newValue);
                    }}
                  />
                  <Button
                    className="flex-none"
                    disabled={!isValid}
                    loading={isSubmitting}
                    variant="plain"
                    buttonSize="sm"
                    type="submit"
                  >
                    Connect
                  </Button>
                </div>
                <ErrorMessage name="projectDomain" component={ErrorLabel} />
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

const MotifAddSourceDialog = ({
  onDidAddSource,
  children,
}: {
  onDidAddSource?: () => void;
  children: ReactNode;
}) => {
  const { team } = useTeam();
  const { project } = useProject();
  const [motifDialogOpen, setMotifDialogOpen] = useState(false);

  return (
    <Dialog.Root open={motifDialogOpen} onOpenChange={setMotifDialogOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-appear dialog-overlay" />
        <Dialog.Content className="animate-dialog-slide-in dialog-content flex max-h-[90%] w-[90%] max-w-[500px] flex-col border">
          <Dialog.Title className="dialog-title flex-none">
            Connect Motif project
          </Dialog.Title>
          <div className="dialog-description flex flex-none flex-col gap-2 border-b border-neutral-900 pb-4">
            <p>
              Sync all public pages from your Motif project. You can specify
              which files to include and exclude from the repository in the{' '}
              <Link
                className="subtle-underline"
                href={`/${team?.slug}/${project?.slug}/settings`}
              >
                project configuration
              </Link>
              .
            </p>
          </div>
          <div className="flex-grow">
            <MotifSource
              onDidAddSource={() => {
                setMotifDialogOpen(false);
                onDidAddSource?.();
              }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default MotifAddSourceDialog;
