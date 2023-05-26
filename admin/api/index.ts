import { KeystoneContext } from '@keystone-6/core/types'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import matter from 'gray-matter'
dayjs.extend(advancedFormat)

export const createPosts = async (
  rawfiles: string[],
  context: KeystoneContext
) => {
  const files: Post[] = []
  rawfiles.forEach((rawContent) => {
    const data = matter(rawContent)
    const { created_date, updated_date, tags, category, title, slug, brief } =
      data.data
    let ctime = 0
    let date = ''
    if (created_date) {
      const day = dayjs(created_date, 'YYYY-MM-DD HH:mm')
      ctime = day.valueOf()
      date = day.format('MM-DD')
    }
    files.push({
      title,
      tags: tags.filter((t) => t !== 'blog'),
      category,
      slug,
      content: data.content,
      ctime,
      date,
      brief,
    })
  })
  let tags: string[] = []
  files.forEach((file) => {
    file.tags && file.tags.length && tags.push(...file.tags)
  })
  tags = [...new Set(tags)]
  const tagMap: Record<string, string> = {}
  for (let i = 0; i < tags.length; ++i) {
    const existId = await context.query.Tag.findMany({
      where: { name: { equals: tags[i] } },
      query: 'id',
    })
    if (existId.length === 1) {
      tagMap[tags[i]] = existId[0].id
    } else {
      const { id } = await context.query.Tag.createOne({
        data: { name: tags[i] },
        query: 'id',
      })
      tagMap[tags[i]] = id
    }
  }
  let categories: string[] = []
  files.forEach((file) => {
    file.category && categories.push(file.category)
  })
  categories = [...new Set(categories)]
  const categoryMap: Record<string, string> = {}
  for (let i = 0; i < categories.length; ++i) {
    const existId = await context.query.Category.findMany({
      where: { name: { equals: categories[i] } },
      query: 'id',
    })
    if (existId.length === 1) {
      categoryMap[categories[i]] = existId[0].id
    } else {
      const { id } = await context.query.Category.createOne({
        data: { name: categories[i] },
        query: 'id',
      })

      categoryMap[categories[i]] = id
    }
  }
  await Promise.all(
    files.map(async (file) => {
      const { tags, category } = file
      file.tags = {}
      tags.forEach((tag) => {
        if (!file.tags.connect) {
          file.tags.connect = []
        }
        file.tags.connect.push({
          id: tagMap[tag],
        })
      })
      if (category) {
        file.category = { connect: { id: categoryMap[category] } }
      }
    })
  )
  const ids = await context.query.Post.createMany({ data: files })
  return ids
}
