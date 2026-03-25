import { CallbackCompletionPage } from '@/components/callcenter/callback-completion-page'
import { isCallbackPersistenceConfigured } from '@/lib/server/callback-persistence-config'

export default async function CallbackCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token = '' } = await searchParams
  const viewModel = token && isCallbackPersistenceConfigured()
    ? await import('@/lib/server/callback-records').then(({ getCallbackCompletionLinkModel }) =>
      getCallbackCompletionLinkModel(token))
    : null

  return <CallbackCompletionPage token={token} viewModel={viewModel} />
}
