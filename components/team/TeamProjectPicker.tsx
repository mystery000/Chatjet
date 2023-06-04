import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Session, useSession } from '@supabase/auth-helpers-react';
import cn from 'classnames';
import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  FormikErrors,
  FormikValues,
} from 'formik';
import { ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useState } from 'react';
import { toast } from 'react-hot-toast';

import { createTeam } from '@/lib/api';
import useProject from '@/lib/hooks/use-project';
import useProjects from '@/lib/hooks/use-projects';
import useTeam from '@/lib/hooks/use-team';
import useTeams from '@/lib/hooks/use-teams';
import useUser from '@/lib/hooks/use-user';
import { TIERS, Tier, getTeamTier } from '@/lib/stripe/tiers';
import { TagColor } from '@/types/types';

import Button from '../ui/Button';
import { ErrorLabel } from '../ui/Forms';
import { NoAutoInput } from '../ui/Input';
import { CTABar } from '../ui/SettingsCard';
import { Slash } from '../ui/Slash';
import { Tag } from '../ui/Tag';

const generateTeamName = (session: Session | null) => {
  if (session?.user) {
    const name =
      session.user.user_metadata.full_name ||
      session.user.user_metadata.name ||
      session.user.user_metadata.user_name;
    return `${name}'s Team`;
  } else {
    return 'New Team';
  }
};

type TeamProjectPickerProps = {
  onNewTeamClick: () => void;
};

const getColorForTier = (tier: Tier): TagColor => {
  switch (tier) {
    case 'enterprise':
      return 'fuchsia';
    case 'pro':
      return 'sky';
    case 'starter':
      return 'sky';
    default:
      return 'green';
  }
};

const TeamPicker: FC<TeamProjectPickerProps> = ({ onNewTeamClick }) => {
  const { user } = useUser();
  const { teams, loading } = useTeams();
  const { team } = useTeam();
  const [isOpen, setOpen] = useState(false);

  if (loading) {
    return <></>;
  }

  const tier = team && getTeamTier(team);

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        {user?.has_completed_onboarding ? (
          <button
            className="no-ring flex select-none flex-row items-center gap-2 rounded py-1 px-2 text-sm text-neutral-300 outline-none transition hover:bg-neutral-900 hover:text-neutral-400"
            aria-label="Select team"
          >
            {team?.name || ''}
            {tier && (
              <Tag color={getColorForTier(tier)}>{TIERS[tier].name}</Tag>
            )}
            <ChevronsUpDown className="h-3 w-3" />
          </button>
        ) : (
          <p className="dropdown-menu-button select-none">{team?.name || ''}</p>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="animate-menu-up dropdown-menu-content"
          sideOffset={5}
        >
          {teams?.map((t) => {
            const checked = t.slug === team?.slug;
            return (
              <DropdownMenu.CheckboxItem
                key={`team-dropdown-${t.slug}`}
                className="dropdown-menu-item dropdown-menu-item-indent"
                checked={checked}
                onClick={() => {
                  setOpen(false);
                }}
              >
                <>
                  {checked && (
                    <DropdownMenu.ItemIndicator className="dropdown-menu-item-indicator">
                      <Check className="h-3 w-3" />
                    </DropdownMenu.ItemIndicator>
                  )}
                  <Link href={`/${t.slug}`}>{t.name}</Link>
                </>
              </DropdownMenu.CheckboxItem>
            );
          })}
          <DropdownMenu.Separator className="dropdown-menu-separator" />
          {team && (
            <DropdownMenu.Item className="dropdown-menu-item dropdown-menu-item-indent">
              <Link href={`/${team.slug}`}>Team settings</Link>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item
            className="dropdown-menu-item dropdown-menu-item-indent"
            onClick={onNewTeamClick}
          >
            Create new team
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

const ProjectPicker = () => {
  const { team } = useTeam();
  const { projects, loading } = useProjects();
  const { project } = useProject();
  const [isOpen, setOpen] = useState(false);

  if (loading || !team || !project) {
    return <></>;
  }

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex select-none flex-row items-center gap-2 rounded px-2 py-1 text-sm text-neutral-300 outline-none transition hover:bg-neutral-900',
          )}
          aria-label="Select team"
        >
          {project.name}
          <ChevronsUpDown className="h-3 w-3" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="animate-menu-up dropdown-menu-content"
          sideOffset={5}
        >
          {projects?.map((p) => {
            const checked = p.slug === project?.slug;
            return (
              <DropdownMenu.CheckboxItem
                key={`project-dropdown-${p.slug}`}
                className="dropdown-menu-item dropdown-menu-item-indent"
                checked={checked}
                onClick={() => {
                  setOpen(false);
                }}
              >
                <>
                  {checked && (
                    <DropdownMenu.ItemIndicator className="dropdown-menu-item-indicator">
                      <Check className="h-3 w-3" />
                    </DropdownMenu.ItemIndicator>
                  )}
                  <Link href={`/${team.slug}/${p.slug}`}>{p.name}</Link>
                </>
              </DropdownMenu.CheckboxItem>
            );
          })}
          <DropdownMenu.Separator className="dropdown-menu-separator" />
          <DropdownMenu.Item className="dropdown-menu-item dropdown-menu-item-indent">
            <Link href={`/settings/${team.slug}/projects/new`}>
              Create new project
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export const TeamProjectPicker = () => {
  const router = useRouter();
  const session = useSession();
  const { user } = useUser();
  const { teams, mutate: mutateTeams, loading: loadingTeams } = useTeams();
  const { team } = useTeam();
  const { project, loading: loadingProject } = useProject();
  const [isNewTeamDialogOpen, setNewTeamDialogOpen] = useState(false);

  if (loadingTeams || !teams || !team) {
    return <></>;
  }

  const isNewProjectRoute =
    router.asPath === `/settings/${team.slug}/projects/new`;

  return (
    <>
      <div className="flex flex-row items-center gap-2">
        <Slash size="md" />

        {team ? (
          <TeamPicker onNewTeamClick={() => setNewTeamDialogOpen(true)} />
        ) : (
          <></>
        )}
        {!loadingProject && team && project && (
          <>
            <Slash size="md" />
            <ProjectPicker />
          </>
        )}
        {isNewProjectRoute && (
          <>
            <Slash size="md" />
            <p className="text-sm text-neutral-300">New project</p>
          </>
        )}
      </div>
      <Dialog.Root
        open={isNewTeamDialogOpen}
        onOpenChange={setNewTeamDialogOpen}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="animate-overlay-appear dialog-overlay" />
          <Dialog.Content className="animate-dialog-slide-in dialog-content max-h-min max-w-min">
            <Dialog.Title className="dialog-title">
              Create new team
            </Dialog.Title>
            <Dialog.Description className="dialog-description">
              Teams help you organize projects and manage members, billing and
              tokens.
            </Dialog.Description>
            <Formik
              initialValues={{ name: generateTeamName(session) }}
              validateOnMount
              validate={(values) => {
                const errors: FormikErrors<FormikValues> = {};
                if (!values.name) {
                  errors.name = 'Required';
                }
                return errors;
              }}
              onSubmit={async (values, { setSubmitting }) => {
                setSubmitting(true);
                const newTeam = await createTeam(values.name);
                await mutateTeams([...(teams || []), newTeam]);
                setSubmitting(false);
                toast.success('Team created.');
                setNewTeamDialogOpen(false);
                setTimeout(() => {
                  router.replace({
                    pathname: '/[team]',
                    query: { team: newTeam.slug },
                  });
                }, 500);
              }}
            >
              {({ isSubmitting, isValid }) => (
                <Form>
                  <div className="mt-2 mb-4 flex min-w-[400px] flex-col gap-1 p-4">
                    <p className="mb-1 text-xs font-medium text-neutral-300">
                      Name
                    </p>
                    <Field
                      type="text"
                      name="name"
                      as={NoAutoInput}
                      disabled={isSubmitting}
                    />
                    <ErrorMessage name="name" component={ErrorLabel} />
                  </div>
                  <CTABar>
                    <Dialog.Close asChild>
                      <Button variant="plain" buttonSize="sm">
                        Cancel
                      </Button>
                    </Dialog.Close>
                    <Button
                      variant="cta"
                      disabled={!isValid}
                      loading={isSubmitting}
                      buttonSize="sm"
                    >
                      Create
                    </Button>
                  </CTABar>
                </Form>
              )}
            </Formik>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default TeamProjectPicker;
