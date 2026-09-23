<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-amber-900">Engagement</h1>
            <p class="dashboard-heading mt-1 text-amber-900">Reward student participation with achievements and a
                points market.</p>
        </div>

        <LibrarianSegmentedTabs v-model="activeTab" class="mb-5" :tabs="tabs" />

        <!-- Achievements -->
        <template v-if="activeTab === 'achievements'">
            <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LibrarianCatalogStatTile label="Achievements" :value="achievements.length" icon="i-tabler-trophy"
                    tone="accent" />
                <LibrarianCatalogStatTile label="Unlocked by students" :value="totalUnlocked"
                    icon="i-tabler-circle-check" tone="success" />
                <LibrarianCatalogStatTile label="Redeemed" :value="totalRedeemed" icon="i-tabler-gift"
                    tone="warning" />
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="achievement-search" v-model="achievementSearch" placeholder="Search achievements" />
                <div class="flex-1"></div>
                <ButtonsButton variant="primary" @click="openAchievementForm(null)">
                    <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add Achievement
                </ButtonsButton>
            </div>

            <LibrarianAchievementsTable :achievements="filteredAchievements" :loading="achievementsPending"
                @edit="openAchievementForm" @delete="askDeleteAchievement" />
        </template>

        <!-- Market -->
        <template v-else-if="activeTab === 'market'">
            <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LibrarianCatalogStatTile label="Market items" :value="items.length" icon="i-tabler-gift"
                    tone="accent" />
                <LibrarianCatalogStatTile label="Low stock" :value="lowStockCount" icon="i-tabler-alert-circle"
                    tone="warning" />
                <LibrarianCatalogStatTile label="Total redemptions" :value="totalItemRedemptions"
                    icon="i-tabler-circle-check" tone="success" />
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="item-search" v-model="itemSearch" placeholder="Search items" />
                <div class="flex-1"></div>
                <ButtonsButton variant="primary" @click="openItemForm(null)">
                    <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add Item
                </ButtonsButton>
            </div>

            <LibrarianMarketItemsTable :items="filteredItems" :loading="itemsPending" @edit="openItemForm"
                @delete="askDeleteItem" />
        </template>

        <!-- Redemptions -->
        <template v-else>
            <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <LibrarianCatalogStatTile label="Pending" :value="redemptionCount('Pending')" icon="i-tabler-clock"
                    tone="warning" />
                <LibrarianCatalogStatTile label="Fulfilled" :value="redemptionCount('Fulfilled')"
                    icon="i-tabler-circle-check" tone="success" />
                <LibrarianCatalogStatTile label="Cancelled" :value="redemptionCount('Cancelled')"
                    icon="i-tabler-circle-x" tone="danger" />
            </div>

            <div class="mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="redemption-search" v-model="redemptionSearch" placeholder="Search student or item" />
                <select v-model="redemptionStatus"
                    class="h-[42px] rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-500 transition-colors hover:bg-stone-50">
                    <option value="Pending">Pending</option>
                    <option value="">All statuses</option>
                    <option value="Fulfilled">Fulfilled</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>

            <LibrarianRedemptionsTable :redemptions="pagedRedemptions" :loading="redemptionsPending"
                @fulfill="handleFulfill" @cancel="askCancelRedemption" />

            <LibrarianPagination :shown="pagedRedemptions.length" :total="filteredRedemptions.length"
                noun="redemptions" :page="redemptionPage" :last-page="redemptionTotalPages"
                @change="redemptionPage = $event" />
        </template>
    

        <LibrarianAchievementFormModal :open="isAchievementOpen" :achievement="editingAchievement" :busy="busy"
            @close="isAchievementOpen = false" @submit="saveAchievement" />
        <LibrarianMarketItemFormModal :open="isItemOpen" :item="editingItem" :busy="busy" @close="isItemOpen = false"
            @submit="saveItem" />
        <LibrarianConfirmModal :open="confirmOpen" :title="confirmState.title" :message="confirmState.message"
            :confirm-label="confirmState.label" :loading="busy" @close="confirmOpen = false" @confirm="runConfirm" />

        <AlertToast />
    
    </div>
</template>

<script setup lang="ts">
import {
    engagementService,
    type AchievementPayload,
    type AchievementRecord,
    type FulfillmentStatus,
    type MarketItemPayload,
    type MarketItemRecord,
    type RedemptionRecord,
} from '~/services/engagementService'
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Engagement' })

const { perform } = useAction()
const route = useRoute()

const activeTab = ref(['achievements', 'market', 'redemptions'].includes(String(route.query.tab)) ? String(route.query.tab) : 'achievements')
const busy = ref(false)

// ---- Data ----
const { data: achievementsResponse, pending: achievementsPending, execute: refetchAchievements } =
    useLiveAsyncData('engagement-achievements', () => engagementService.fetchAchievements(), { lazy: true })
const { data: itemsResponse, pending: itemsPending, execute: refetchItems } =
    useLiveAsyncData('engagement-items', () => engagementService.fetchMarketItems(), { lazy: true })
const { data: redemptionsResponse, pending: redemptionsPending, execute: refetchRedemptions } =
    useLiveAsyncData('engagement-redemptions', () => engagementService.fetchRedemptions(), { lazy: true })

const achievements = computed(() => achievementsResponse.value?.achievements ?? [])
const items = computed(() => itemsResponse.value?.items ?? [])
const redemptions = computed(() => redemptionsResponse.value?.redemptions ?? [])

const tabs = computed(() => [
    { label: 'Achievements', value: 'achievements' },
    { label: 'Rewards Market', value: 'market' },
    { label: 'Redemptions', value: 'redemptions', badge: redemptionCount('Pending') },
])

// ---- Achievements ----
const achievementSearch = ref('')
const totalUnlocked = computed(() => achievements.value.reduce((sum, a) => sum + a.unlockedCount, 0))
const totalRedeemed = computed(() => achievements.value.reduce((sum, a) => sum + a.redeemedCount, 0))
const filteredAchievements = computed(() => {
    const term = achievementSearch.value.trim().toLowerCase()
    return achievements.value.filter((a) => !term || a.name.toLowerCase().includes(term))
})

const isAchievementOpen = ref(false)
const editingAchievement = ref<AchievementRecord | null>(null)

function openAchievementForm(achievement: AchievementRecord | null) {
    editingAchievement.value = achievement
    isAchievementOpen.value = true
}

async function saveAchievement(payload: AchievementPayload) {
    busy.value = true
    const target = editingAchievement.value
    const ok = await perform(
        () => target ? engagementService.updateAchievement(target.achievementID, payload) : engagementService.createAchievement(payload),
        target ? 'Achievement updated' : 'Achievement added',
        'Could not save achievement',
        [refetchAchievements],
    )
    busy.value = false
    if (ok) isAchievementOpen.value = false
}

// ---- Market items ----
const itemSearch = ref('')
const lowStockCount = computed(() => items.value.filter((i) => i.stock > 0 && i.stock <= 3).length)
const totalItemRedemptions = computed(() => items.value.reduce((sum, i) => sum + i.redemptions_count, 0))
const filteredItems = computed(() => {
    const term = itemSearch.value.trim().toLowerCase()
    return items.value.filter((i) => !term || i.name.toLowerCase().includes(term) || (i.type ?? '').toLowerCase().includes(term))
})

const isItemOpen = ref(false)
const editingItem = ref<MarketItemRecord | null>(null)

function openItemForm(item: MarketItemRecord | null) {
    editingItem.value = item
    isItemOpen.value = true
}

async function saveItem(payload: MarketItemPayload) {
    busy.value = true
    const target = editingItem.value
    const ok = await perform(
        () => target ? engagementService.updateMarketItem(target.itemID, payload) : engagementService.createMarketItem(payload),
        target ? 'Item updated' : 'Item added',
        'Could not save item',
        [refetchItems],
    )
    busy.value = false
    if (ok) isItemOpen.value = false
}

// ---- Redemptions ----
const redemptionSearch = ref('')
const redemptionStatus = ref<'' | FulfillmentStatus>('Pending')
const redemptionPage = ref(1)
const REDEMPTIONS_PER_PAGE = 10

const redemptionCount = (status: FulfillmentStatus) => redemptions.value.filter((r) => r.fulfillmentStatus === status).length

const filteredRedemptions = computed(() => {
    const term = redemptionSearch.value.trim().toLowerCase()
    return redemptions.value.filter((r) => {
        if (redemptionStatus.value && r.fulfillmentStatus !== redemptionStatus.value) return false
        return !term || personName(r.student?.user).toLowerCase().includes(term) || (r.item?.name ?? '').toLowerCase().includes(term)
    })
})
const redemptionTotalPages = computed(() => Math.max(1, Math.ceil(filteredRedemptions.value.length / REDEMPTIONS_PER_PAGE)))
const pagedRedemptions = computed(() => {
    const start = (redemptionPage.value - 1) * REDEMPTIONS_PER_PAGE
    return filteredRedemptions.value.slice(start, start + REDEMPTIONS_PER_PAGE)
})
watch([redemptionSearch, redemptionStatus], () => { redemptionPage.value = 1 })

function handleFulfill(redemption: RedemptionRecord) {
    return perform(() => engagementService.fulfillRedemption(redemption.redemptionID), 'Redemption fulfilled', 'Could not fulfill redemption', [refetchRedemptions])
}

// ---- Confirmations (delete / cancel) ----
const confirmOpen = ref(false)
const confirmState = ref<{ title: string; message: string; label: string; action: () => Promise<boolean> }>({
    title: '', message: '', label: 'Confirm', action: async () => true,
})

function ask(title: string, message: string, label: string, action: () => Promise<boolean>) {
    confirmState.value = { title, message, label, action }
    confirmOpen.value = true
}

async function runConfirm() {
    busy.value = true
    const ok = await confirmState.value.action()
    busy.value = false
    if (ok) confirmOpen.value = false
}

function askDeleteAchievement(achievement: AchievementRecord) {
    ask(
        'Delete achievement?',
        `“${achievement.name}” will be removed, along with every student's progress toward it. This can't be undone.`,
        'Delete',
        () => perform(() => engagementService.deleteAchievement(achievement.achievementID), 'Achievement deleted', 'Could not delete achievement', [refetchAchievements]),
    )
}

function askDeleteItem(item: MarketItemRecord) {
    ask(
        'Delete item?',
        `“${item.name}” will be removed from the rewards market.`,
        'Delete',
        () => perform(() => engagementService.deleteMarketItem(item.itemID), 'Item deleted', 'Could not delete item', [refetchItems]),
    )
}

function askCancelRedemption(redemption: RedemptionRecord) {
    ask(
        'Cancel redemption?',
        `${personName(redemption.student?.user)} gets ${redemption.pointsSpent} points back and “${redemption.item?.name ?? 'the item'}” is restocked.`,
        'Cancel redemption',
        () => perform(() => engagementService.cancelRedemption(redemption.redemptionID), 'Redemption cancelled', 'Could not cancel redemption', [refetchRedemptions, refetchItems]),
    )
}
</script>

