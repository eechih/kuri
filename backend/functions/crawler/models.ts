interface Crawler {
  userId: string
  crawlerId: string
  crawlerName: string
  state: 'Pending' | 'Processing' | 'Completed' | 'Failed'
  description?: string
  messageId?: string
  messageBody?: string
  creationTime: string // ISO 8601
  processingTime?: string // ISO 8601
  completedTime?: string // ISO 8601
  failedTime?: string // ISO 8601
  tracing?: string
  processDuration?: string
}

interface Group {
  groupId: string
  groupName: string
  groupTitle: string
}

interface CrawledPost {
  userId: string
  postId: string
  message?: string
  wwwURL?: string
  photoImages?: string[]
  groupId: string
  groupName?: string
  postTime?: string // ISO 8601
  crawledTime?: string // ISO 8601
}

const groups: Group[] = [
  {
    groupId: '1627303077535381',
    groupName: 'CAT',
    groupTitle: '葉貓子',
  },
  {
    groupId: '1609346979360808',
    groupName: 'MONEY',
    groupTitle: 'MONEY株式會社',
  },
  {
    groupId: '271036763241107',
    groupName: 'APPLE',
    groupTitle: 'GAUK✿日韓台✿彩妝&用品&食品&銀飾等商品',
  },
  {
    groupId: '434711967302746',
    groupName: 'WISH',
    groupTitle: 'Wish日韓食品百貨團購批發',
  },
  { groupId: '459187861817528', groupName: 'JL', groupTitle: 'JL批發(二館)' },
  {
    groupId: 'u8muiuof',
    groupName: 'DAD',
    groupTitle: '淳爸嚴選百貨(泓益萱)',
  },
  {
    groupId: '1778536625719309',
    groupName: 'YOSHIDA',
    groupTitle: 'Yoshida 吉田批發',
  },
]

export { Crawler, Group, CrawledPost, groups }
