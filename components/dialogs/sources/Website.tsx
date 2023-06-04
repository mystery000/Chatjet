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

import { DocsLimit } from '@/components/files/DocsLimit';
import Button from '@/components/ui/Button';
import { ErrorLabel } from '@/components/ui/Forms';
import { NoAutoInput } from '@/components/ui/Input';
import { Note } from '@/components/ui/Note';
import { addSource, deleteSource } from '@/lib/api';
import useProject from '@/lib/hooks/use-project';
import useSources from '@/lib/hooks/use-sources';
import useTeam from '@/lib/hooks/use-team';
import useUsage from '@/lib/hooks/use-usage';
import useUser from '@/lib/hooks/use-user';
import { isWebsiteAccessible } from '@/lib/integrations/website';
import { getLabelForSource, toNormalizedUrl } from '@/lib/utils';
import { Project } from '@/types/types';

const _addSource = async (
  projectId: Project['id'],
  url: string,
  mutate: () => void,
) => {
  try {
    const newSource = await addSource(projectId, 'website', {
      url,
    });
    await mutate();
    toast.success(
      `The source ${getLabelForSource(
        newSource,
      )} has been added to the project.`,
    );
  } catch (e) {
    console.error(e);
    toast.error(`${e}`);
  }
};

type WebsiteSourceProps = {
  clearPrevious?: boolean;
  openPricingAsDialog?: boolean;
  onDidAddSource: () => void;
};

const WebsiteSource: FC<WebsiteSourceProps> = ({
  clearPrevious,
  openPricingAsDialog,
  onDidAddSource,
}) => {
  const { project } = useProject();
  const { user } = useUser();
  const { numTokensPerTeamRemainingAllowance } = useUsage();
  const { sources, mutate } = useSources();
  const [website, setWebsite] = useState('');

  if (!user) {
    return <></>;
  }

  return (
    <>
      <Formik
        initialValues={{ website: '' }}
        validateOnBlur
        onSubmit={async (_values, { setSubmitting, setErrors }) => {
          if (!project || !website) {
            return;
          }

          let url = toNormalizedUrl(website);

          let isAccessible = await isWebsiteAccessible(url);
          if (!isAccessible) {
            url = toNormalizedUrl(website, true);
            isAccessible = await isWebsiteAccessible(url);
          }

          if (!isAccessible) {
            const errors: FormikErrors<FormikValues> = {
              website: 'Website is not accessible',
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
          track('connect website');
          await _addSource(project.id, url, mutate);
          setSubmitting(false);
          onDidAddSource();
        }}
      >
        {({ isSubmitting, isValid }) => (
          <Form className="h-full flex-grow">
            <div className="flex h-full flex-grow flex-col gap-2">
              <div className="h-flex-none mt-4 flex flex-col gap-1 px-4 pb-8">
                <p className="mb-1 flex-none text-sm font-medium text-neutral-300">
                  Website URL
                </p>
                <div className="flex flex-none flex-row gap-2">
                  <Field
                    className="flex-grow"
                    type="text"
                    name="website"
                    placeholder="example.com"
                    inputSize="sm"
                    as={NoAutoInput}
                    disabled={isSubmitting}
                    value={website}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      setWebsite(event.target.value);
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
                <ErrorMessage name="website" component={ErrorLabel} />
                <Note size="sm" className="mt-4" type="warning">
                  Make sure the website allows you to index its content. Do not
                  build on top of other people&apos;s work unless you have
                  explicit authorization to do so.
                </Note>
                {numTokensPerTeamRemainingAllowance !== 'unlimited' && (
                  <div className="mt-2 rounded-md border border-neutral-900">
                    <DocsLimit />
                  </div>
                )}
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
};

const WebsiteAddSourceDialog = ({
  onDidAddSource,
  openPricingAsDialog,
  children,
}: {
  onDidAddSource?: () => void;
  openPricingAsDialog?: boolean;
  children: ReactNode;
}) => {
  const { team } = useTeam();
  const { project } = useProject();
  const [websiteDialogOpen, setWebsiteDialogOpen] = useState(false);

  return (
    <Dialog.Root open={websiteDialogOpen} onOpenChange={setWebsiteDialogOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="animate-overlay-appear dialog-overlay" />
        <Dialog.Content className="animate-dialog-slide-in dialog-content flex max-h-[90%] w-[90%] max-w-[500px] flex-col border">
          <Dialog.Title className="dialog-title flex-none">
            Connect website
          </Dialog.Title>
          <div className="dialog-description flex flex-none flex-col gap-2 border-b border-neutral-900 pb-4">
            <p>
              Sync pages from a website. You can specify which files to include
              and exclude from the website in the{' '}
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
            <WebsiteSource
              openPricingAsDialog={openPricingAsDialog}
              onDidAddSource={() => {
                setWebsiteDialogOpen(false);
                onDidAddSource?.();
              }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default WebsiteAddSourceDialog;
