// admin/pages/custom-page.tsx
import Link from 'next/link'
import { PageContainer } from '@keystone-6/core/admin-ui/components'
import {
  useMutation,
  gql,
  useLazyQuery,
  useQuery,
} from '@keystone-6/core/admin-ui/apollo'

import { Heading, Box } from '@keystone-ui/core'
import { Button } from '@keystone-ui/button'
import { useToasts } from '@keystone-ui/toast'

const UPDATE_UPLOAD_POST = gql`
  mutation UpdateUploadPost($where: UploadPostWhereUniqueInput!, $data: UploadPostUpdateInput!) {
    updateUploadPost(where: $where, data: $data) {
      id
    }
  }
`

const SEARCH_UPLOAD_POSTS = gql`
  query SearchUploadPosts($where: UploadPostWhereInput!) {
    uploadPosts(where: $where) {
      id
      attachment
    }
  }
`

const ADD_TAG = gql`
  mutation AddTag($data: TagCreateInput!) {
    createTag(data: $data) {
      id
    }
  }
`
/**
 * 1. 标记 upload post 为 publish，清空 preview（删除会导致原文件删除）
 * 2. 创建新的 post，不再删除原文件
 * 3. 修改 post，在笔记软件改，删除 post 再上传
 */
//
export default function CustomPage() {
  return <p>ssdf</p>
}
// export default function CustomPage() {
//   const [updateUploadPost, { loading }] = useMutation(UPDATE_UPLOAD_POST)
//   const {
//     data: { uploadPosts: uploadPostsList },
//   } = useQuery(SEARCH_UPLOAD_POSTS, {
//     variables: { where: { isLive: { equals: false } } },
//   })
//   const { addToast } = useToasts()
//   const createPost = async () => {
//     const data = {
//       title: 'title',
//       tags: ['性能优化'],
//       slug: `${Date.now()}`,
//       content: 'hello world',
//       ctime: 0,
//       date: '',
//       brief: 'hello',
//     }
//     let tags = data.tags.concat()
//     const tagMap: Record<string, string> = {}
//     for (let i = 0; i < tags.length; ++i) {
//       const { data: existId } = await searchTag({
//         variables: { where: { name: { equals: tags[i] } } },
//       })
//       if (existId.tags.length === 1) {
//         tagMap[tags[i]] = existId.tags[0].id
//       } else {
//         const {
//           data: { createTag: id },
//         } = await createTag({
//           variables: { data: { name: tags[i] } },
//         })
//         tagMap[tags[i]] = id
//       }
//     }
//     data.tags = {}
//     if (Object.keys(tagMap).length > 0) {
//       data.tags.connect = Object.values(tagMap).map((id) => ({ id }))
//     }

//     const item = await createItem({ variables: { data: data } })
//     if (item) {
//       addToast({ title: 'create successfully', tone: 'positive' })
//     }
//   }

//   const uploadRawPost = async () => {
//     const input = document.createElement('input')
//     input.type = 'file'
//     input.style = 'position: fixed;visibility: hidden;'
//     document.body.appendChild(input)
//     input.addEventListener('change')
//     input.click()

//     input.remove()
//   }

//   return (
//     <PageContainer header={<Heading type="h3">Custom Page</Heading>}>
//       <section>
//         {uploadPostsList.map((post) => {
//           return (
//             <div key={post.id}>
//               <div>{post.id}</div>
//               <div>{post.attachment}</div>
//               <Button
//                 tone="positive"
//                 isLoading={loading}
//                 onClick={async () => {
//                   await updateUploadPost({
//                     variables: {
//                       where: {
//                         id: { equals: post.id },
//                         data: { isLive: true },
//                       },
//                     },
//                   })
//                 }}
//               >
//                 publish
//               </Button>
//             </div>
//           )
//         })}
//       </section>
//     </PageContainer>
//   )
// }
