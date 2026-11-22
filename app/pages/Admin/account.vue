<template>
    <div>
        <!-- Who you are: the same card as the top of the student profile -->
        <section class="mb-5 flex flex-wrap items-center gap-x-6 gap-y-4 rounded-[22px] border border-stone-200 bg-white p-5 md:p-6">
            <div class="flex min-w-0 flex-1 items-center gap-4">
                <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[22px] font-extrabold text-white">
                    {{ initials }}
                </div>
                <div class="min-w-0">
                    <h1 class="dashboard-heading truncate text-[26px] font-extrabold leading-tight text-crimson">{{ me?.name ?? fullName }}</h1>
                    <p class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-stone-500">
                        <LibrarianStatusPill :label="me?.roleLabel ?? 'Administrator'" tone="info" />
                        <span class="font-data truncate">{{ me?.email }}</span>
                    </p>
                </div>
            </div>
            <p class="max-w-[260px] text-[13px] leading-snug text-stone-500 max-md:hidden">Your name appears in the header and in the audit log next to everything you change.</p>
        </section>

        <div v-if="error && !me" role="alert" class="rounded-2xl border border-red-100 bg-red-50 p-5 text-[15px] text-red-600">
            <p class="font-semibold">Couldn't load your account.</p>
            <p class="mt-1 leading-snug">{{ apiErrorMessage(error, 'The server did not respond.') }}</p>
            <ButtonsButton variant="ghost" class="mt-3" @click="refetch()">Try again</ButtonsButton>
        </div>

        <div v-else class="relative grid gap-5 lg:grid-cols-2 lg:items-start">
            <section class="rounded-[22px] border border-stone-200 bg-white p-5 md:p-6">
                <h2 class="text-[17px] font-bold text-stone-900">Your details</h2>
                <p class="mt-0.5 text-[13px] text-stone-500">The name and email on your account.</p>

                <form class="mt-4 grid gap-3.5" novalidate @submit.prevent="saveProfile">
                    <div class="grid gap-3.5 sm:grid-cols-2">
                        <LibrarianTextField id="account-first" v-model="profile.firstName" label="First name" autocomplete="given-name"
                            :error="profileErrors.firstName" @update:model-value="profileErrors.firstName = ''" />
                        <LibrarianTextField id="account-last" v-model="profile.lastName" label="Last name" autocomplete="family-name"
                            :error="profileErrors.lastName" @update:model-value="profileErrors.lastName = ''" />
                    </div>
                    <LibrarianTextField id="account-email" v-model="profile.email" type="email" label="Email" autocomplete="email"
                        :error="profileErrors.email" @update:model-value="profileErrors.email = ''" />
                    <div class="mt-1 flex items-center gap-3">
                        <ButtonsButton type="submit" :disabled="!profileDirty || savingProfile">
                            <span v-if="savingProfile" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            {{ savingProfile ? 'Saving…' : 'Save changes' }}
                        </ButtonsButton>
                        <button v-if="profileDirty && !savingProfile" type="button" class="text-[13px] font-semibold text-stone-500 hover:text-stone-800" @click="resetProfile">
                            Undo
                        </button>
                    </div>
                </form>
            </section>

            <div class="grid gap-5">
                <section class="rounded-[22px] border border-stone-200 bg-white p-5 md:p-6">
                    <h2 class="text-[17px] font-bold text-stone-900">Account record</h2>
                    <p class="mt-0.5 text-[13px] text-stone-500">Set by the system. Another administrator can change a role.</p>
                    <dl class="mt-3">
                        <div v-for="row in lockedRows" :key="row.label" class="flex items-center justify-between gap-4 border-b border-stone-100 py-2.5 text-[14px] last:border-0">
                            <dt class="flex items-center gap-2 text-stone-500"><Icon name="i-tabler-lock" class="h-3.5 w-3.5 text-stone-400" />{{ row.label }}</dt>
                            <dd class="min-w-0 truncate text-right text-stone-900">{{ row.value || '—' }}</dd>
                        </div>
                    </dl>
                </section>

                <section class="rounded-[22px] border border-stone-200 bg-white p-5 md:p-6">
                    <h2 class="text-[17px] font-bold text-stone-900">Password</h2>
                    <form class="mt-3.5 grid gap-3.5" novalidate @submit.prevent="savePassword">
                        <AuthPasswordField id="currentPassword" v-model="pw.currentPassword" label="Current password" autocomplete="current-password"
                            :error="pwErrors.currentPassword" @update:model-value="pwErrors.currentPassword = ''" />
                        <div class="grid gap-3.5 sm:grid-cols-2">
                            <AuthPasswordField id="newPassword" v-model="pw.newPassword" label="New password" autocomplete="new-password"
                                placeholder="At least 10 characters" :error="pwErrors.newPassword" @update:model-value="pwErrors.newPassword = ''" />
                            <AuthPasswordField id="newPassword_confirmation" v-model="pw.confirm" label="Confirm new password" autocomplete="new-password"
                                placeholder="Repeat it" />
                        </div>
                        <ul class="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px]" aria-label="Password requirements">
                            <li v-for="rule in pwRules" :key="rule.label" class="inline-flex items-center gap-1.5 transition-colors duration-200"
                                :class="rule.met ? 'text-emerald-600' : 'text-stone-500'">
                                <span class="h-[7px] w-[7px] rounded-full transition-colors duration-200" :class="rule.met ? 'bg-emerald-500' : 'bg-stone-200'" />{{ rule.label }}
                            </li>
                        </ul>
                        <div>
                            <ButtonsButton type="submit" :disabled="!pwReady || savingPw">
                                <span v-if="savingPw" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                {{ savingPw ? 'Changing…' : 'Change password' }}
                            </ButtonsButton>
                        </div>
                    </form>
                </section>
            </div>
        </div>

        <AlertToast />
    </div>
</template>

<script setup lang="ts">
import { adminService } from '~/services/adminService'
import { settingsService } from '~/services/settingsService'
import AlertToast from '~/api/alert/AlertToast.vue'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({ middleware: 'admin', layout: 'librarian' })
useHead({ title: 'Account settings' })

const alert = useAlert()
const { firstName: firstNameCookie, lastName: lastNameCookie } = useAuthSession()

// The staff list already says which account is the signed-in one, with its name, email and role.
const { data, error, execute: refetch } = useAsyncData('admin-account', () => adminService.staff(), { lazy: true })
const me = computed(() => data.value?.staff.find((a) => a.isYou) ?? null)

const fullName = computed(() => `${firstNameCookie.value ?? ''} ${lastNameCookie.value ?? ''}`.trim() || 'Administrator')
const initials = computed(() => {
    const f = me.value?.firstName ?? firstNameCookie.value ?? ''
    const l = me.value?.lastName ?? lastNameCookie.value ?? ''
    return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || '?'
})

/* ---- details ---- */
const profile = reactive({ firstName: '', lastName: '', email: '' })
const profileErrors = reactive({ firstName: '', lastName: '', email: '' })
const saved = computed(() => ({ firstName: me.value?.firstName ?? '', lastName: me.value?.lastName ?? '', email: me.value?.email ?? '' }))
const profileDirty = computed(() => (['firstName', 'lastName', 'email'] as const).some((k) => profile[k].trim() !== saved.value[k]))

function resetProfile() {
    Object.assign(profile, saved.value)
    Object.assign(profileErrors, { firstName: '', lastName: '', email: '' })
}
// Fill the form once the account arrives, and again after a save; never over the top of unsaved typing.
// "Typing" means differing from the account as it WAS a moment ago (before it arrived, that is an empty form).
watch(saved, (_, before) => {
    const typing = before && (['firstName', 'lastName', 'email'] as const).some((k) => profile[k].trim() !== before[k])
    if (!typing) resetProfile()
}, { immediate: true })

const savingProfile = ref(false)
async function saveProfile() {
    profileErrors.firstName = profile.firstName.trim() ? '' : 'First name is required.'
    profileErrors.lastName = profile.lastName.trim() ? '' : 'Last name is required.'
    profileErrors.email = /^\S+@\S+\.\S+$/.test(profile.email.trim()) ? '' : 'Enter a valid email address.'
    if (profileErrors.firstName || profileErrors.lastName || profileErrors.email) return

    savingProfile.value = true
    try {
        const result = await settingsService.updateAccount({
            firstName: profile.firstName.trim(),
            lastName: profile.lastName.trim(),
            email: profile.email.trim(),
        })
        // The header reads these cookies, so keep its name and initials current.
        firstNameCookie.value = result.account.firstName
        lastNameCookie.value = result.account.lastName
        await refetch()
        alert.success('Details saved')
    } catch (err) {
        const fields = apiFieldErrors(err) as Record<string, string>
        Object.assign(profileErrors, { firstName: fields.firstName ?? '', lastName: fields.lastName ?? '', email: fields.email ?? '' })
        if (!Object.keys(fields).length) alert.error('Could not save your details', apiErrorMessage(err))
    } finally {
        savingProfile.value = false
    }
}

const lockedRows = computed(() => [
    { label: 'Role', value: me.value?.roleLabel },
    { label: 'Status', value: me.value ? (me.value.isDisabled ? 'Disabled' : 'Active') : '' },
    { label: 'Phone', value: me.value?.phoneNumber },
])

/* ---- password (staff passwords are at least 10 characters, as the server insists) ---- */
const pw = reactive({ currentPassword: '', newPassword: '', confirm: '' })
const pwErrors = reactive({ currentPassword: '', newPassword: '' })
const pwRules = computed(() => [
    { label: '10+ characters', met: pw.newPassword.length >= 10 },
    { label: 'Passwords match', met: !!pw.newPassword && pw.newPassword === pw.confirm },
    { label: 'Different from current', met: !!pw.newPassword && pw.newPassword !== pw.currentPassword },
])
const pwReady = computed(() => !!pw.currentPassword && pwRules.value.every((r) => r.met))

const savingPw = ref(false)
async function savePassword() {
    if (!pwReady.value) return
    savingPw.value = true
    try {
        await settingsService.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword, newPassword_confirmation: pw.confirm })
        Object.assign(pw, { currentPassword: '', newPassword: '', confirm: '' })
        alert.success('Password changed', 'Use the new one next time you sign in.')
    } catch (err) {
        const fields = apiFieldErrors(err) as Record<string, string>
        pwErrors.currentPassword = fields.currentPassword ?? ''
        pwErrors.newPassword = fields.newPassword ?? ''
        if (!Object.keys(fields).length) alert.error('Could not change your password', apiErrorMessage(err))
        else if (fields.currentPassword) document.getElementById('currentPassword')?.focus()
    } finally {
        savingPw.value = false
    }
}
</script>
