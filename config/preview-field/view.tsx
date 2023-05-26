import React from 'react'
import { FieldContainer, FieldLabel } from '@keystone-ui/fields'
import { CellContainer } from '@keystone-6/core/admin-ui/components'

import {
  CardValueComponent,
  CellComponent,
  FieldController,
  FieldControllerConfig,
  FieldProps,
} from '@keystone-6/core/types'
import matter from 'gray-matter'

// field 展示的 ui
export function Field({
  field,
  value,
  onChange,
  autoFocus,
}: FieldProps<typeof controller>) {
  const rawContent = value
  if (!rawContent) {
    return (
      <FieldContainer as="fieldset">
        <FieldLabel>{field.label}</FieldLabel>
        <section>
          <p>no data preview</p>
        </section>
      </FieldContainer>
    )
  }
  const data = matter(rawContent)
  const post = {
    content: data.content,
    ...data.data,
  }
  const handlePreview = () => {
    const frame = document.querySelector<HTMLIFrameElement>('#post-preview')
    frame?.contentWindow?.postMessage(JSON.stringify(post), '*')
  }
  return (
    <FieldContainer as="fieldset">
      <FieldLabel>{field.label}</FieldLabel>
      <section
        style={{
          width: '680px',
          height: '1366px',
          padding: '24px',
          border: '1px solid #ccc',
          borderRadius: '5px',
        }}
      >
        <iframe
          style={{ width: '100%', height: '100%' }}
          id="post-preview"
          src={
            process.env._DEV_
              ? 'http://localhost:4000/preview'
              : `${process.env.BLOG.site}/preview`
          }
          onLoad={handlePreview}
        ></iframe>
      </section>
    </FieldContainer>
  )
}

export const Cell: CellComponent = ({ item, field, linkTo }) => {
  return <CellContainer>preview</CellContainer>
}
Cell.supportsLinkTo = true

export const CardValue: CardValueComponent = ({ item, field }) => {
  return (
    <FieldContainer>
      <FieldLabel>{field.label}</FieldLabel>
    </FieldContainer>
  )
}

// 处理输入输出，提交数据和从接口获取数据时
export const controller = (
  config: FieldControllerConfig<{}>
): FieldController<string | null, string> => {
  return {
    path: config.path,
    label: config.label,
    description: config.description,
    graphqlSelection: config.path,
    defaultValue: null,
    deserialize: (data) => {
      const value = data[config.path]
      return typeof value === 'string' ? value : null
    },
    serialize: (value) => ({ [config.path]: value }),
  }
}
