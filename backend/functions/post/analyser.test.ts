import { analyse, AnalyzeResult, findOption, findTags } from './analyser'
import { CrawledPost, Post } from './models'

const crawledPost: CrawledPost = {
  userId: 'test',
  postId: '3383280365270968',
  groupId: '1627303077535381',
  groupName: 'CAT',
  message:
    "有專櫃中文標\n-----2/14 晚上8點準時收單------\nF12E-4549 美國契爾氏金盞花植物精華化妝水40ml\n批 170 留言內大圖 (不能公開販售)\n 🍓特價：199\n\n專櫃唯一安瓶級👍修護舒緩化妝水推薦\n好評不斷的「金盞花植物精華化妝水」\nKIEHL'S熱銷60年的明星化妝水 🎊熱銷NO.1\n深受名人和消費者喜愛\n被喻為「神奇化妝水💥」！！！\n溫和🚫不含酒精 敏感肌也適用\n有效修護鎮定調🌿讓肌膚更聽話\n運用😎獨家科技與技術\n萃取自金盞花及多種天然植物精華✨✨\n將金盞花💗5大活萃完美封存於花瓣中\n再放入化妝水中💪💪\n🤩讓金盞花化妝水鎮定舒緩、修護調理的功效更快又有效\n一擦化妝水就能秒清爽補水💧\n15分鐘舒緩敏感泛紅、🔥3天改善痘痘粉刺!*搭配抗痘產品使用\n有效修護調理👏、舒緩肌膚 搞定惱人肌膚問題🌞\n\n❤️契爾氏化妝水網路評價極高\n❤️萃取自金盞花及其他天然植物精華\n❤️可活化、調理肌膚，並可修護青春痘疤痕、收斂毛孔\n❤️鎮靜舒緩肌膚泛紅敏感症狀\n❤️妝前絕佳好物，敷完整個臉超清爽\n❤️完全不黏膩，使用起來有淡淡的香氣\n❤️裡面還有小花瓣更是「熬夜夜貓們的救星」\n完全靠一瓶金盞花來拯救怎能不愛金盞花化妝水\nKIEHL'S熱銷50年的明星化妝水，溫和不含酒精，敏感肌也適用\n化妝水第一首選買金盞花化妝水就對啦～😘\n\n🚨保存期限：2024.01\n🌼規格：40ml\n🌼產地: 美國\n🌼使用方法：一般使用方法\n🌼保存方法：請置於陰涼處，請勿直接陽光照射，以免變質",
  wwwURL:
    'https://www.facebook.com/groups/1627303077535381/permalink/3383280365270968/',
  photoImages: [
    'https://scontent-atl3-2.xx.fbcdn.net/v/t39.30808-6/329791109_684257103397212_7742338309848377813_n.jpg?stp=dst-jpg_p526x296&_nc_cat=101&ccb=1-7&_nc_sid=5cd70e&_nc_ohc=ug5s7dLK6lgAX-p0ujN&_nc_ht=scontent-atl3-2.xx&oh=00_AfDN33lKcmFtb_RTSf7avoygz42g3fX2ppEU99CM1RWtMA&oe=63E8F08E',
  ],
  creationTime: '2023-02-08T08:02:17+08:00',
  crawledTime: '2023-02-08T14:51:31+08:00',
}

describe('analyzer', () => {
  test('analyze post', () => {
    const analyzedPost: Post = analyse(crawledPost)
    console.log(analyzedPost)
    expect(analyzedPost.productName).toBe('美國契爾氏金盞花植物精華化妝水40ml')
    expect(analyzedPost.productPrice).toBe(199)
    expect(analyzedPost.productCost).toBe(170)
    expect(analyzedPost.productOption).toBeUndefined()
    expect(analyzedPost.productStatusDate).toBe('2023-02-14T20:00:00+08:00')
  })
})

describe('findOption', () => {
  test('should find an option group', () => {
    const postMessage =
      'F1-11307 中大童木耳邊袖坑條上衣\n批發價：190\n🍓特價：225\n\n顏色［黑，咖］\n--下單範例: 黑100+1'
    const article = postMessage.split('\n')
    const result: AnalyzeResult<string[][]> = findOption(article)
    expect(result?.data).toEqual([['黑', '咖']])
  })
  test('should find multiple option groups', () => {
    const postMessage =
      'F1-11307 中大童木耳邊袖坑條上衣\n批發價：190\n🍓特價：225\n\n顏色［黑，咖/90，100，110，120］\n--下單範例: 黑100+1'
    const article = postMessage.split('\n')
    const result: AnalyzeResult<string[][]> = findOption(article)
    expect(result?.data).toEqual([
      ['黑', '咖'],
      ['90', '100', '110', '120'],
    ])
  })
  test('should not find any option groups', () => {
    const postMessage =
      'F1-11307 中大童木耳邊袖坑條上衣\n批發價：190\n🍓特價：225\n\n--下單範例: +1'
    const article = postMessage.split('\n')
    const result: AnalyzeResult<string[][]> = findOption(article)
    expect(result?.data).toBeUndefined()
  })
})

describe('findTags', () => {
  test('only find specific keywords', () => {
    const postMessages = [
      '---- 現貨 "紅咖哩(1),綠咖哩(1),瑪莎曼咖哩(1)" 可認購 售完關團 ----\n\nF12E-3826 泰國AROY-D即食綠咖哩醬250ml (2-3人份)\n\n批:60\n🍓特價: 80 \n\n款式:[紅咖哩,綠咖哩,瑪莎曼咖哩]---下單範例: 紅咖哩+1\n\n懶人輕鬆煮咖哩系列~~~\n誰也一樣喜歡泰式💥!!\n在家也能吃到道地泰國味~~~',
      '------限量100組,快速到貨-----售完關團\nF12E-2957 德恩奈漱口水買一送一(特價活動 1000ml+500ml)\n批:230(留言內大圖) \n🍓特價：268\n\n💦常洗手  多漱口   一起預防病毒入侵\n🌵德恩奈清新雙效漱口水\n不含酒精配方,全新「+木糖醇」雙重防蛀配方,每日早晚使用.能強化法瑯質\n有效降低蛀牙率30%-50%。',
      '重新開團\n-----2/27 晚上8點準時收單------\nF1-10723 三段式防滑橡筋長筒襪\n\n批發價：60(留言內大圖)\n🍓特價：79 \n\n顏色［黑，深藍，深棕，咖啡，酒紅，膚，白，深灰］\n------下單範例：黑+1',
      '----2/27 晚上8點準時收單-------------\nF1-11327 日本多功能食物盤超值組\n\n批發價：75(留言內大圖)\n🍓特價：99\n\n款式［長方3個裝，正方4個裝］\n---下單範例: 長方3個裝+1\n\n生活好幫手，多功能小物',
    ]
    const expectedTags = [
      ['現貨', '售完關團'],
      ['限量', '售完關團'],
      ['重新開團'],
      [],
    ]

    postMessages.forEach((postMessage, index) => {
      const article = postMessage.split('\n')
      const result: AnalyzeResult<string[]> = findTags(article)
      expect(result?.data).toEqual(expectedTags[index])
    })
  })
})
