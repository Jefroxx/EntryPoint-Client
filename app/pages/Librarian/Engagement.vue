<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-crimson">Engagement</h1>
            <p class="dashboard-heading mt-1 text-crimson">Reward student participation with achievements and a rewards market.</p>
        </div>

        <LibrarianSegmentedTabs v-model="activeTab" wrap class="mb-5" :tabs="tabs" />

        <!-- ============ Achievements ============ -->
        <template v-if="activeTab === 'achievements'">
            <div class="phone-stats mb-5 grid grid-cols-2 gap-3 xl:grid-cols-3">
                <LibrarianCatalogStatTile label="Achievements" :value="achievementsResponse ? achievements.length : '—'" icon="i-tabler-trophy" tone="accent" />
                <LibrarianCatalogStatTile label="Unlocked by students" :value="achievementsResponse ? totalUnlocked : '—'" icon="i-tabler-circle-check" tone="success" />
                <LibrarianCatalogStatTile label="Rewards claimed" :value="achievementsResponse ? totalRedeemed : '—'" icon="i-tabler-gift" tone="warning" />
            </div>

            <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="achievement-search" v-model="achievementSearch" class="!min-w-[210px] !max-w-[560px] !basis-[480px]" placeholder="Search achievements" />
                <LibrarianFilterMenu class="toolbar-full" v-model="achievementFilters" :groups="achievementFilterGroups" />
                <div class="flex-1"></div>
                <ButtonsButton variant="primary" class="toolbar-full" @click="openAchievementForm(null)">
                    <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add Achievement
                </ButtonsButton>
            </div>

            <LibrarianAchievementsTable :achievements="filteredAchievements" :loading="achievementsPending" :metrics="achievementMetrics"
                @edit="openAchievementForm" @delete="askDeleteAchievement" />
        </template>

        <!-- ============ Rewards market ============ -->
        <template v-else-if="activeTab === 'market'">
            <div class="phone-stats mb-5 grid grid-cols-2 gap-3 xl:grid-cols-3">
                <LibrarianCatalogStatTile label="Rewards" :value="itemsResponse ? items.length : '—'" icon="i-tabler-gift" tone="accent" />
                <!-- Tap to see only the rewards that need topping up (low, or out of stock). -->
                <LibrarianStatTileButton label="Low or out of stock" :value="itemsResponse ? lowStockCount : '—'" icon="i-tabler-alert-circle" tone="warning"
                    :active="stockFilter === 'low'" @click="stockFilter = stockFilter === 'low' ? '' : 'low'" />
                <LibrarianCatalogStatTile label="Redemptions made" :value="redemptionsResponse ? redemptionsMade : '—'" icon="i-tabler-circle-check" tone="success" />
            </div>

            <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="item-search" v-model="itemSearch" class="!min-w-[210px] !max-w-[560px] !basis-[480px]" placeholder="Search rewards" />
                <LibrarianFilterMenu class="toolbar-full" v-model="itemFilters" :groups="itemFilterGroups" />
                <div class="flex-1"></div>
                <ButtonsButton variant="primary" class="toolbar-full" @click="openItemForm(null)">
                    <Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add Reward
                </ButtonsButton>
            </div>

            <LibrarianMarketItemsTable :items="filteredItems" :loading="itemsPending" :redemptions="redemptions" :low-stock-at="lowStockAt"
                @edit="openItemForm" @delete="askDeleteItem" />
        </template>

        <!-- ============ Reward types ============ -->
        <LibrarianResourceTypesPanel v-else-if="activeTab === 'types'" :types="typeRows" :loading="typesPending"
            intro="The kinds of reward. A reward is given one of these when it is added, so every one is spelled the same way."
            empty-text="No types yet. Add one (Merchandise, Voucher…) to sort your rewards."
            :unit="{ one: 'reward', many: 'rewards' }" @add="openTypeForm(null)" @edit="openTypeForm" @delete="askDeleteType" />

        <!-- ============ Redemptions ============ -->
        <template v-else-if="activeTab === 'redemptions'">
            <!-- The counts, and each is also the filter: tap one to see only those, tap it again to see them all. -->
            <div class="phone-stats mb-5 grid grid-cols-2 gap-3 xl:grid-cols-3">
                <LibrarianStatTileButton v-for="tile in redemptionTiles" :key="tile.status" :label="tile.label" :value="redemptionsResponse ? redemptionCount(tile.status) : '—'"
                    :icon="tile.icon" :tone="tile.tone" :active="redemptionStatus === tile.status"
                    @click="redemptionStatus = redemptionStatus === tile.status ? 'all' : tile.status" />
            </div>

            <div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
                <LibrarianSearchInput id="redemption-search" v-model="redemptionSearch" class="!min-w-[210px] !max-w-[560px] !basis-[480px]" placeholder="Search student or reward" />
                <LibrarianFilterMenu class="toolbar-full" v-model="redemptionFilters" :groups="redemptionFilterGroups" />
                <div class="flex-1"></div>
            </div>

            <LibrarianRedemptionsTable :redemptions="pagedRedemptions" :loading="redemptionsPending"
                @fulfill="(r) => openRedemption(r, 'fulfill')" @cancel="(r) => openRedemption(r, 'cancel')" />

            <LibrarianPagination :shown="pagedRedemptions.length" :total="filteredRedemptions.length"
                noun="redemptions" :page="redemptionPage" :last-page="redemptionTotalPages"
                @change="redemptionPage = $event" />
        </template>

        <!-- ============ Hall of Fame (the month's standouts; students see the same boards on their Home page) ============ -->
        <HallOfFame v-else :board="hallOfFame ?? null" :loading="hallOfFamePending" />

        <LibrarianAchievementFormModal :open="isAchievementOpen" :achievement="editingAchievement" :metrics="achievementMetrics" :busy="busy"
            @close="isAchievementOpen = false" @submit="saveAchievement" />
        <LibrarianMarketItemFormModal :open="isItemOpen" :item="editingItem" :types="typeNames" :busy="busy" @close="isItemOpen = false"
            @submit="saveItem" />
        <LibrarianResourceTypeFormModal :open="isTypeFormOpen" :type="editingType" noun="reward" example="Merchandise" :busy="busy"
            @close="isTypeFormOpen = false" @submit="handleSaveType" />
        <LibrarianRedemptionReviewModal :open="isRedemptionOpen" :mode="redemptionMode" :redemption="redemptionTarget" :busy="redemptionBusy"
            @close="isRedemptionOpen = false" @submit="confirmRedemption" />
        <!-- Deleting shows everything tied to the achievement or reward, page by page, before it goes. -->
        <LibrarianRemoveAchievementModal :open="isRemoveAchievementOpen" :achievement="removingAchievement" :busy="busy"
            @close="isRemoveAchievementOpen = false" @confirm="deleteAchievement" />
        <LibrarianRemoveItemModal :open="isRemoveItemOpen" :item="removingItem" :redemptions="redemptions" :busy="busy"
            @close="isRemoveItemOpen = false" @confirm="deleteItem" />
        <LibrarianConfirmModal :open="deleteTypeOpen" title="Delete Type?"
            :message="`“${deleteTypeTarget?.name ?? 'This type'}” will be removed from the list. No reward has it, so nothing else changes.`"
            confirm-label="Delete" :loading="busy" @close="deleteTypeOpen = false" @confirm="handleDeleteType" />

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
    type MarketItemPhotoChange,
    type MarketItemRecord,
    type RedemptionRecord,
} from '~/services/engagementService'
import { librarianService } from '~/services/librarianService'
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Engagement' })

const { perform } = useAction()
const route = useRoute()
const ALL = 'all'

const activeTab = ref(['achievements', 'market', 'types', 'redemptions', 'hall-of-fame'].includes(String(route.query.tab)) ? String(route.query.tab) : 'achievements')
const busy = ref(false)

// ---- Data ----
const { data: achievementsResponse, pending: achievementsPending, execute: refetchAchievements } =
    useLiveAsyncData('engagement-achievements', () => engagementService.fetchAchievements(), { lazy: true })
const { data: itemsResponse, pending: itemsPending, execute: refetchItems } =
    useLiveAsyncData('engagement-items', () => engagementService.fetchMarketItems(), { lazy: true })
const { data: redemptionsResponse, pending: redemptionsPending, execute: refetchRedemptions } =
    useLiveAsyncData('engagement-redemptions', () => engagementService.fetchRedemptions(), { lazy: true })
// The server recalculates the boards every 5 minutes at most, so polling faster than that shows nothing new.
const { data: hallOfFame, pending: hallOfFamePending } =
    useLiveAsyncData('engagement-hall-of-fame', () => librarianService.fetchHallOfFame(), { lazy: true, pollMs: 300_000 })
const { data: typesResponse, pending: typesPending, execute: refetchTypes } =
    useLiveAsyncData('engagement-item-types', () => engagementService.fetchItemTypes(), { lazy: true })

const achievements = computed(() => achievementsResponse.value?.achievements ?? [])
const achievementMetrics = computed(() => achievementsResponse.value?.metrics ?? [])
const items = computed(() => itemsResponse.value?.items ?? [])
// A reward with this many left, or fewer, is running low (set in Settings > Rewards).
const lowStockAt = computed(() => itemsResponse.value?.lowStockAt ?? 3)
const redemptions = computed(() => redemptionsResponse.value?.redemptions ?? [])
const types = computed(() => typesResponse.value?.types ?? [])
const typeNames = computed(() => types.value.map((t) => t.name))
const typeRows = computed(() => types.value.map((t) => ({ uuid: t.uuid, name: t.name, count: t.items_count })))

const redemptionCount = (status: FulfillmentStatus) => redemptions.value.filter((r) => r.fulfillmentStatus === status).length

const tabs = computed(() => [
    { label: 'Achievements', value: 'achievements' },
    { label: 'Rewards Market', short: 'Rewards', value: 'market' },
    { label: 'Reward Types', short: 'Types', value: 'types' },
    { label: 'Redemptions', value: 'redemptions', badge: redemptionCount('Pending') || undefined },
    { label: 'Hall of Fame', short: 'Fame', value: 'hall-of-fame' },
])

// ---- Achievements ----
const achievementSearch = ref('')
const achievementUnlocked = ref<'' | 'some' | 'none'>('')
const achievementOrder = ref<'name' | 'unlocked' | 'reward'>('name')
const totalUnlocked = computed(() => achievements.value.reduce((sum, a) => sum + a.unlockedCount, 0))
const totalRedeemed = computed(() => achievements.value.reduce((sum, a) => sum + a.redeemedCount, 0))

const achievementFilterGroups = [
    { key: 'unlocked', title: 'Unlocked', options: [{ value: ALL, label: 'Any' }, { value: 'some', label: 'Unlocked by someone' }, { value: 'none', label: 'Nobody yet' }] },
    { key: 'order', title: 'Order', allValue: 'name', options: [{ value: 'name', label: 'Name, A to Z' }, { value: 'unlocked', label: 'Most unlocked' }, { value: 'reward', label: 'Highest reward' }] },
]
const achievementFilters = computed({
    get: () => ({ unlocked: achievementUnlocked.value || ALL, order: achievementOrder.value }),
    set: (v) => {
        achievementUnlocked.value = (v.unlocked === ALL ? '' : v.unlocked) as typeof achievementUnlocked.value
        achievementOrder.value = v.order as typeof achievementOrder.value
    },
})

const filteredAchievements = computed(() => {
    const term = achievementSearch.value.trim().toLowerCase()
    const list = achievements.value.filter((a) => {
        if (achievementUnlocked.value === 'some' && a.unlockedCount === 0) return false
        if (achievementUnlocked.value === 'none' && a.unlockedCount > 0) return false
        return !term || a.name.toLowerCase().includes(term)
    })
    return list.sort((a, b) => {
        if (achievementOrder.value === 'unlocked') return b.unlockedCount - a.unlockedCount || a.name.localeCompare(b.name)
        if (achievementOrder.value === 'reward') return b.pointsReward - a.pointsReward || a.name.localeCompare(b.name)
        return a.name.localeCompare(b.name)
    })
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
        () => target ? engagementService.updateAchievement(target.uuid, payload) : engagementService.createAchievement(payload),
        target ? 'Achievement updated' : 'Achievement added',
        'Could not save achievement',
        [refetchAchievements],
    )
    busy.value = false
    if (ok) isAchievementOpen.value = false
}

// ---- Rewards (the items students spend points on) ----
const itemSearch = ref('')
const stockFilter = ref<'' | 'in' | 'low' | 'out'>('')
const itemType = ref('')
const itemOrder = ref<'name' | 'costLow' | 'costHigh' | 'redeemed'>('name')
// Low or out of stock: what needs topping up.
const lowStockCount = computed(() => items.value.filter((i) => i.stock <= lowStockAt.value).length)
// Counted without the cancelled ones: those were refunded, so they are not redemptions that stand.
const redemptionsMade = computed(() => redemptions.value.filter((r) => r.fulfillmentStatus !== 'Cancelled').length)

const itemFilterGroups = computed(() => [
    { key: 'stock', title: 'Stock', options: [
        { value: ALL, label: 'Any' },
        { value: 'in', label: 'In stock' },
        { value: 'low', label: 'Low or out of stock' },
        { value: 'out', label: 'Out of stock' },
    ] },
    { key: 'type', title: 'Type', options: [{ value: ALL, label: 'All types' }, ...typeNames.value.map((name) => ({ value: name, label: name }))] },
    { key: 'order', title: 'Order', allValue: 'name', options: [
        { value: 'name', label: 'Name, A to Z' },
        { value: 'costLow', label: 'Cost, low to high' },
        { value: 'costHigh', label: 'Cost, high to low' },
        { value: 'redeemed', label: 'Most redeemed' },
    ] },
])
const itemFilters = computed({
    get: () => ({ stock: stockFilter.value || ALL, type: itemType.value || ALL, order: itemOrder.value }),
    set: (v) => {
        stockFilter.value = (v.stock === ALL ? '' : v.stock) as typeof stockFilter.value
        itemType.value = v.type === ALL ? '' : v.type
        itemOrder.value = v.order as typeof itemOrder.value
    },
})

const filteredItems = computed(() => {
    const term = itemSearch.value.trim().toLowerCase()
    const list = items.value.filter((i) => {
        if (stockFilter.value === 'in' && i.stock <= lowStockAt.value) return false
        if (stockFilter.value === 'low' && i.stock > lowStockAt.value) return false
        if (stockFilter.value === 'out' && i.stock !== 0) return false
        if (itemType.value && i.type !== itemType.value) return false
        return !term || i.name.toLowerCase().includes(term) || (i.type ?? '').toLowerCase().includes(term)
    })
    return list.sort((a, b) => {
        if (itemOrder.value === 'costLow') return a.pointCost - b.pointCost || a.name.localeCompare(b.name)
        if (itemOrder.value === 'costHigh') return b.pointCost - a.pointCost || a.name.localeCompare(b.name)
        if (itemOrder.value === 'redeemed') return b.redemptions_count - a.redemptions_count || a.name.localeCompare(b.name)
        return a.name.localeCompare(b.name)
    })
})

const isItemOpen = ref(false)
const editingItem = ref<MarketItemRecord | null>(null)

function openItemForm(item: MarketItemRecord | null) {
    editingItem.value = item
    isItemOpen.value = true
}

async function saveItem(payload: MarketItemPayload, photo: MarketItemPhotoChange) {
    busy.value = true
    const target = editingItem.value
    const ok = await perform(
        async () => {
            let itemUuid = target?.uuid
            let result: { message?: string }
            if (target) {
                result = await engagementService.updateMarketItem(target.uuid, payload)
            } else {
                const created = await engagementService.createMarketItem(payload)
                itemUuid = created.item.uuid
                // If the photo upload below fails, the window stays open on the reward that now exists,
                // so trying again edits it instead of adding a duplicate.
                editingItem.value = { ...created.item, redemptions_count: 0 }
                result = created
            }
            if (photo.blob) await engagementService.uploadMarketItemPhoto(itemUuid!, photo.blob)
            else if (photo.remove) await engagementService.deleteMarketItemPhoto(itemUuid!)
            return result
        },
        target ? 'Reward updated' : 'Reward added',
        'Could not save reward',
        [refetchItems, refetchTypes],
    )
    busy.value = false
    if (ok) isItemOpen.value = false
}

// ---- Reward types (the list a reward's type is picked from) ----
const isTypeFormOpen = ref(false)
const editingType = ref<{ uuid: string; name: string } | null>(null)

function openTypeForm(type: { uuid: string; name: string } | null) {
    editingType.value = type
    isTypeFormOpen.value = true
}

async function handleSaveType(name: string) {
    busy.value = true
    const target = editingType.value
    const oldName = target?.name
    const ok = await perform(
        () => target ? engagementService.renameItemType(target.uuid, { name }) : engagementService.createItemType({ name }),
        target ? 'Type renamed' : 'Type added',
        'Could not save the type',
        [refetchTypes, refetchItems],
    )
    busy.value = false
    if (!ok) return
    isTypeFormOpen.value = false
    // A filter set to the old name follows the rename.
    if (oldName && itemType.value === oldName) itemType.value = name
}

const deleteTypeTarget = ref<{ uuid: string; name: string } | null>(null)
const deleteTypeOpen = ref(false)
const askDeleteType = (type: { uuid: string; name: string }) => {
    deleteTypeTarget.value = type
    deleteTypeOpen.value = true
}

async function handleDeleteType() {
    if (!deleteTypeTarget.value) return
    const uuid = deleteTypeTarget.value.uuid
    busy.value = true
    const ok = await perform(() => engagementService.deleteItemType(uuid), 'Type deleted', 'Could not delete the type', [refetchTypes])
    busy.value = false
    if (ok) deleteTypeOpen.value = false
}

// ---- Redemptions ----
const redemptionSearch = ref('')
// 'Pending' is what needs doing, so it is what opens.
const redemptionStatus = ref<'all' | FulfillmentStatus>('Pending')
const redemptionSort = ref<'oldest' | 'newest'>('oldest')
const redemptionPage = ref(1)
const REDEMPTIONS_PER_PAGE = 12 // fills whole rows of the 1, 2 and 3 column card grid

const redemptionTiles = [
    { status: 'Pending' as const, label: 'Pending', icon: 'i-tabler-clock', tone: 'warning' as const },
    { status: 'Fulfilled' as const, label: 'Fulfilled', icon: 'i-tabler-circle-check', tone: 'success' as const },
    { status: 'Cancelled' as const, label: 'Cancelled', icon: 'i-tabler-circle-x', tone: 'danger' as const },
]

// The oldest first where there is a queue to work through (pending), newest first for what is finished.
const defaultRedemptionSort = computed<'oldest' | 'newest'>(() => (redemptionStatus.value === 'Pending' ? 'oldest' : 'newest'))
// Changing the status moves the order to that status's own default, unless the order was picked on purpose.
watch(redemptionStatus, (next, previous) => {
    const previousDefault = previous === 'Pending' ? 'oldest' : 'newest'
    if (redemptionSort.value === previousDefault) redemptionSort.value = defaultRedemptionSort.value
})

const redemptionFilterGroups = computed(() => [
    { key: 'status', title: 'Status', allValue: 'Pending', options: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Fulfilled', label: 'Fulfilled' },
        { value: 'Cancelled', label: 'Cancelled' },
        { value: ALL, label: 'All statuses' },
    ] },
    { key: 'order', title: 'Order', allValue: defaultRedemptionSort.value, options: [
        { value: 'oldest', label: 'Oldest first' },
        { value: 'newest', label: 'Newest first' },
    ] },
])
const redemptionFilters = computed({
    get: () => ({ status: redemptionStatus.value, order: redemptionSort.value }),
    set: (v) => {
        redemptionStatus.value = v.status as typeof redemptionStatus.value
        redemptionSort.value = v.order as typeof redemptionSort.value
    },
})

const filteredRedemptions = computed(() => {
    const term = redemptionSearch.value.trim().toLowerCase()
    const list = redemptions.value.filter((r) => {
        if (redemptionStatus.value !== ALL && r.fulfillmentStatus !== redemptionStatus.value) return false
        return !term || personName(r.student?.user).toLowerCase().includes(term) || (r.item?.name ?? '').toLowerCase().includes(term)
    })
    const direction = redemptionSort.value === 'oldest' ? 1 : -1
    return list.sort((a, b) => direction * (new Date(a.redeemedAt).getTime() - new Date(b.redeemedAt).getTime()))
})
const redemptionTotalPages = computed(() => Math.max(1, Math.ceil(filteredRedemptions.value.length / REDEMPTIONS_PER_PAGE)))
const pagedRedemptions = computed(() => {
    const start = (redemptionPage.value - 1) * REDEMPTIONS_PER_PAGE
    return filteredRedemptions.value.slice(start, start + REDEMPTIONS_PER_PAGE)
})
watch([redemptionSearch, redemptionStatus, redemptionSort], () => { redemptionPage.value = 1 })

// Fulfilling and cancelling a redemption both ask first, in one window: the reward, the student and the redemption,
// then a last confirmation. Nothing changes until that final button. Cancelling also takes the reason the student is told.
const isRedemptionOpen = ref(false)
const redemptionMode = ref<'fulfill' | 'cancel'>('fulfill')
const redemptionTarget = ref<RedemptionRecord | null>(null)
const redemptionBusy = ref(false)

function openRedemption(redemption: RedemptionRecord, mode: 'fulfill' | 'cancel') {
    redemptionTarget.value = redemption
    redemptionMode.value = mode
    isRedemptionOpen.value = true
}

async function confirmRedemption(reason = '') {
    const redemption = redemptionTarget.value
    if (!redemption) return
    redemptionBusy.value = true
    const ok = redemptionMode.value === 'fulfill'
        ? await perform(() => engagementService.fulfillRedemption(redemption.uuid), 'Redemption fulfilled', 'Could not fulfill redemption', [refetchRedemptions])
        : await perform(() => engagementService.cancelRedemption(redemption.uuid, reason), 'Redemption cancelled', 'Could not cancel redemption', [refetchRedemptions, refetchItems])
    redemptionBusy.value = false
    if (ok) isRedemptionOpen.value = false
}

// ---- Deleting (each shows what is tied to it first) ----
const isRemoveAchievementOpen = ref(false)
const removingAchievement = ref<AchievementRecord | null>(null)
const isRemoveItemOpen = ref(false)
const removingItem = ref<MarketItemRecord | null>(null)

function askDeleteAchievement(achievement: AchievementRecord) {
    removingAchievement.value = achievement
    isRemoveAchievementOpen.value = true
}

async function deleteAchievement() {
    const target = removingAchievement.value
    if (!target) return
    busy.value = true
    const ok = await perform(() => engagementService.deleteAchievement(target.uuid), 'Achievement deleted', 'Could not delete achievement', [refetchAchievements])
    busy.value = false
    if (ok) isRemoveAchievementOpen.value = false
}

function askDeleteItem(item: MarketItemRecord) {
    removingItem.value = item
    isRemoveItemOpen.value = true
}

async function deleteItem() {
    const target = removingItem.value
    if (!target) return
    busy.value = true
    const ok = await perform(() => engagementService.deleteMarketItem(target.uuid), 'Reward deleted', 'Could not delete reward', [refetchItems, refetchTypes])
    busy.value = false
    if (ok) isRemoveItemOpen.value = false
}
</script>
