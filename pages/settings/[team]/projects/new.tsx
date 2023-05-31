import {
  ErrorMessage,
  Field,
  Form,
  Formik,
  FormikErrors,
  FormikValues,
} from 'formik';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

import { TeamSettingsLayout } from '@/components/layouts/TeamSettingsLayout';
import Button from '@/components/ui/Button';
import { ErrorLabel } from '@/components/ui/Forms';
import { NoAutoInput } from '@/components/ui/Input';
import { createProject } from '@/lib/api';
import useProjects from '@/lib/hooks/use-projects';
import useTeam from '@/lib/hooks/use-team';
import { showConfetti } from '@/lib/utils';

const NewProject = () => {
  const router = useRouter();
  const { team } = useTeam();
  const { projects, mutate: mutateProjects } = useProjects();

  return (
    <TeamSettingsLayout title="New project" width="xs">
      <div className="mx-auto">
        <div>
          <Formik
            initialValues={{ name: '' }}
            validateOnMount
            validate={async (values) => {
              const errors: FormikErrors<FormikValues> = {};

              if (!values.name) {
                errors.name = 'Required';
                return errors;
              }

              return errors;
            }}
            onSubmit={async (values, { setSubmitting }) => {
              if (!team) {
                return;
              }

              const newProject = await createProject(team.id, values.name);
              await mutateProjects([...(projects || []), newProject]);
              setSubmitting(false);
              toast.success('Project created.');
              setTimeout(() => {
                showConfetti();
                router.replace({
                  pathname: '/[team]/[project]/data',
                  query: { team: team.slug, project: newProject.slug },
                });
              }, 500);
            }}
          >
            {({ isSubmitting, isValid }) => (
              <Form>
                <div className="flex flex-col gap-1">
                  <p className="mb-1 text-xs font-medium text-neutral-300">
                    Name
                  </p>
                  <Field
                    type="text"
                    name="name"
                    as={NoAutoInput}
                    disabled={isSubmitting}
                    autoFocus
                  />
                  <ErrorMessage name="name" component={ErrorLabel} />
                </div>
                <div className="flex flex-row justify-end gap-4 py-8">
                  <Button
                    disabled={!isValid}
                    loading={isSubmitting}
                    variant="cta"
                    type="submit"
                  >
                    Create
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </TeamSettingsLayout>
  );
};

export default NewProject;
