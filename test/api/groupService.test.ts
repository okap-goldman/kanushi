import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { db } from '@/lib/db/client'
import { groups, groupMembers, groupChats } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { User } from '@supabase/supabase-js'
import * as groupService from '@/lib/groupService'

// モックユーザー
const mockUser: User = {
  id: 'user123',
  email: 'user@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

const mockUser2: User = {
  id: 'user456',
  email: 'user2@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

describe('グループサービス', () => {
  beforeEach(async () => {
    // テストデータのクリーンアップ
    await db.delete(groupChats).execute()
    await db.delete(groupMembers).execute()
    await db.delete(groups).execute()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('グループ作成', () => {
    it('無料グループを作成できる', async () => {
      const groupData = {
        name: 'テストグループ',
        description: 'これはテストグループです',
        groupType: 'free' as const,
      }

      const result = await groupService.createGroup(mockUser.id, groupData)

      expect(result).toBeDefined()
      expect(result.name).toBe(groupData.name)
      expect(result.description).toBe(groupData.description)
      expect(result.groupType).toBe('free')
      expect(result.ownerUserId).toBe(mockUser.id)
      expect(result.memberLimit).toBe(100)

      // オーナーが自動的にメンバーとして追加されているか確認
      const members = await db
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.groupId, result.id))
        .execute()

      expect(members).toHaveLength(1)
      expect(members[0].userId).toBe(mockUser.id)
      expect(members[0].role).toBe('owner')
      expect(members[0].status).toBe('active')
    })

    it('有料グループを作成できる', async () => {
      const groupData = {
        name: '有料テストグループ',
        description: '月額1000円のグループです',
        groupType: 'subscription' as const,
        subscriptionPrice: 1000,
      }

      const result = await groupService.createGroup(mockUser.id, groupData)

      expect(result).toBeDefined()
      expect(result.name).toBe(groupData.name)
      expect(result.groupType).toBe('subscription')
      expect(result.subscriptionPrice).toBe(1000)
      expect(result.storesPriceId).toBeDefined() // Stores.jp連携のIDが設定される
    })

    it('必須項目が不足している場合はエラーになる', async () => {
      const invalidData = {
        description: '名前がありません',
        groupType: 'free' as const,
      }

      await expect(
        groupService.createGroup(mockUser.id, invalidData as any)
      ).rejects.toThrow('グループ名は必須です')
    })

    it('グループ名が100文字を超える場合はエラーになる', async () => {
      const longName = 'あ'.repeat(101)
      const groupData = {
        name: longName,
        description: 'テスト',
        groupType: 'free' as const,
      }

      await expect(
        groupService.createGroup(mockUser.id, groupData)
      ).rejects.toThrow('グループ名は100文字以内で入力してください')
    })
  })

  describe('グループ参加', () => {
    let testGroup: any

    beforeEach(async () => {
      // テスト用グループを作成
      testGroup = await groupService.createGroup(mockUser.id, {
        name: '参加テストグループ',
        description: 'メンバー参加のテスト用',
        groupType: 'free',
      })
    })

    it('無料グループに参加できる', async () => {
      const result = await groupService.joinGroup(mockUser2.id, testGroup.id)

      expect(result).toBeDefined()
      expect(result.groupId).toBe(testGroup.id)
      expect(result.userId).toBe(mockUser2.id)
      expect(result.role).toBe('member')
      expect(result.status).toBe('active')
    })

    it('既に参加しているグループには参加できない', async () => {
      // 一度参加
      await groupService.joinGroup(mockUser2.id, testGroup.id)

      // 再度参加を試みる
      await expect(
        groupService.joinGroup(mockUser2.id, testGroup.id)
      ).rejects.toThrow('既にグループに参加しています')
    })

    it('メンバー数が上限に達している場合は参加できない', async () => {
      // メンバー上限を2に設定したグループを作成
      const limitedGroup = await groupService.createGroup(mockUser.id, {
        name: '上限テストグループ',
        description: 'メンバー上限2名',
        groupType: 'free',
        memberLimit: 2,
      })

      // 1人目の参加（オーナー含めて2名になる）
      await groupService.joinGroup(mockUser2.id, limitedGroup.id)

      // 2人目の参加試行
      const mockUser3 = { ...mockUser, id: 'user789' }
      await expect(
        groupService.joinGroup(mockUser3.id, limitedGroup.id)
      ).rejects.toThrow('グループのメンバー数が上限に達しています')
    })

    it('存在しないグループには参加できない', async () => {
      await expect(
        groupService.joinGroup(mockUser2.id, 'non-existent-group-id')
      ).rejects.toThrow('グループが見つかりません')
    })
  })

  describe('グループ退出', () => {
    let testGroup: any

    beforeEach(async () => {
      testGroup = await groupService.createGroup(mockUser.id, {
        name: '退出テストグループ',
        description: '退出機能のテスト',
        groupType: 'free',
      })
      // mockUser2を参加させる
      await groupService.joinGroup(mockUser2.id, testGroup.id)
    })

    it('一般メンバーはグループから退出できる', async () => {
      const result = await groupService.leaveGroup(mockUser2.id, testGroup.id)

      expect(result).toBe(true)

      // メンバーステータスが'left'になっているか確認
      const member = await db
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, testGroup.id),
            eq(groupMembers.userId, mockUser2.id)
          )
        )
        .execute()

      expect(member[0].status).toBe('left')
      expect(member[0].leftAt).toBeDefined()
    })

    it('オーナーはグループから退出できない', async () => {
      await expect(
        groupService.leaveGroup(mockUser.id, testGroup.id)
      ).rejects.toThrow('グループオーナーは退出できません')
    })

    it('参加していないグループからは退出できない', async () => {
      const mockUser3 = { ...mockUser, id: 'user789' }
      await expect(
        groupService.leaveGroup(mockUser3.id, testGroup.id)
      ).rejects.toThrow('グループのメンバーではありません')
    })
  })

  describe('グループチャット', () => {
    let testGroup: any

    beforeEach(async () => {
      testGroup = await groupService.createGroup(mockUser.id, {
        name: 'チャットテストグループ',
        description: 'チャット機能のテスト',
        groupType: 'free',
      })
      await groupService.joinGroup(mockUser2.id, testGroup.id)
    })

    it('テキストメッセージを送信できる', async () => {
      const messageData = {
        messageType: 'text' as const,
        textContent: 'こんにちは、テストメッセージです',
      }

      const result = await groupService.sendGroupMessage(
        mockUser2.id,
        testGroup.id,
        messageData
      )

      expect(result).toBeDefined()
      expect(result.groupId).toBe(testGroup.id)
      expect(result.userId).toBe(mockUser2.id)
      expect(result.messageType).toBe('text')
      expect(result.textContent).toBe(messageData.textContent)
    })

    it('画像メッセージを送信できる', async () => {
      const messageData = {
        messageType: 'image' as const,
        mediaUrl: 'https://example.com/image.jpg',
      }

      const result = await groupService.sendGroupMessage(
        mockUser.id,
        testGroup.id,
        messageData
      )

      expect(result).toBeDefined()
      expect(result.messageType).toBe('image')
      expect(result.mediaUrl).toBe(messageData.mediaUrl)
    })

    it('音声メッセージを送信できる', async () => {
      const messageData = {
        messageType: 'audio' as const,
        mediaUrl: 'https://example.com/audio.mp3',
      }

      const result = await groupService.sendGroupMessage(
        mockUser.id,
        testGroup.id,
        messageData
      )

      expect(result).toBeDefined()
      expect(result.messageType).toBe('audio')
      expect(result.mediaUrl).toBe(messageData.mediaUrl)
    })

    it('メンバーでない場合はメッセージを送信できない', async () => {
      const mockUser3 = { ...mockUser, id: 'user789' }
      const messageData = {
        messageType: 'text' as const,
        textContent: 'このメッセージは送信できないはず',
      }

      await expect(
        groupService.sendGroupMessage(mockUser3.id, testGroup.id, messageData)
      ).rejects.toThrow('グループのメンバーではありません')
    })

    it('退出したメンバーはメッセージを送信できない', async () => {
      // mockUser2を退出させる
      await groupService.leaveGroup(mockUser2.id, testGroup.id)

      const messageData = {
        messageType: 'text' as const,
        textContent: '退出後のメッセージ',
      }

      await expect(
        groupService.sendGroupMessage(mockUser2.id, testGroup.id, messageData)
      ).rejects.toThrow('アクティブなメンバーではありません')
    })
  })

  describe('グループチャット履歴', () => {
    let testGroup: any

    beforeEach(async () => {
      testGroup = await groupService.createGroup(mockUser.id, {
        name: '履歴テストグループ',
        description: 'チャット履歴のテスト',
        groupType: 'free',
      })

      // 複数のメッセージを送信
      for (let i = 0; i < 5; i++) {
        await groupService.sendGroupMessage(mockUser.id, testGroup.id, {
          messageType: 'text',
          textContent: `メッセージ${i + 1}`,
        })
      }
    })

    it('チャット履歴を取得できる', async () => {
      const result = await groupService.getGroupMessages(
        mockUser.id,
        testGroup.id
      )

      expect(result).toBeDefined()
      expect(result.messages).toHaveLength(5)
      expect(result.messages[0].textContent).toBe('メッセージ5') // 新しい順
      expect(result.messages[4].textContent).toBe('メッセージ1')
    })

    it('ページネーションが機能する', async () => {
      // さらに50件追加
      for (let i = 5; i < 55; i++) {
        await groupService.sendGroupMessage(mockUser.id, testGroup.id, {
          messageType: 'text',
          textContent: `メッセージ${i + 1}`,
        })
      }

      const firstPage = await groupService.getGroupMessages(
        mockUser.id,
        testGroup.id
      )

      expect(firstPage.messages).toHaveLength(50)
      expect(firstPage.nextCursor).toBeDefined()

      // 次のページを取得
      const secondPage = await groupService.getGroupMessages(
        mockUser.id,
        testGroup.id,
        { cursor: firstPage.nextCursor }
      )

      expect(secondPage.messages).toHaveLength(5)
      expect(secondPage.nextCursor).toBeNull()
    })

    it('メンバーでない場合は履歴を取得できない', async () => {
      await expect(
        groupService.getGroupMessages(mockUser2.id, testGroup.id)
      ).rejects.toThrow('グループのメンバーではありません')
    })
  })

  describe('メンバー管理', () => {
    let testGroup: any

    beforeEach(async () => {
      testGroup = await groupService.createGroup(mockUser.id, {
        name: 'メンバー管理テストグループ',
        description: 'メンバー管理機能のテスト',
        groupType: 'free',
      })
      await groupService.joinGroup(mockUser2.id, testGroup.id)
    })

    it('メンバー一覧を取得できる', async () => {
      const result = await groupService.getGroupMembers(
        mockUser.id,
        testGroup.id
      )

      expect(result).toBeDefined()
      expect(result.members).toHaveLength(2)
      expect(result.members.some(m => m.userId === mockUser.id)).toBe(true)
      expect(result.members.some(m => m.userId === mockUser2.id)).toBe(true)
    })

    it('オーナーはメンバーを除名できる', async () => {
      const result = await groupService.removeMember(
        mockUser.id,
        testGroup.id,
        mockUser2.id
      )

      expect(result).toBe(true)

      // メンバーステータスが'removed'になっているか確認
      const member = await db
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, testGroup.id),
            eq(groupMembers.userId, mockUser2.id)
          )
        )
        .execute()

      expect(member[0].status).toBe('removed')
    })

    it('オーナー以外はメンバーを除名できない', async () => {
      const mockUser3 = { ...mockUser, id: 'user789' }
      await groupService.joinGroup(mockUser3.id, testGroup.id)

      await expect(
        groupService.removeMember(mockUser2.id, testGroup.id, mockUser3.id)
      ).rejects.toThrow('グループオーナーのみがメンバーを除名できます')
    })

    it('オーナー自身は除名できない', async () => {
      await expect(
        groupService.removeMember(mockUser.id, testGroup.id, mockUser.id)
      ).rejects.toThrow('オーナーは除名できません')
    })
  })

  describe('グループ情報更新', () => {
    let testGroup: any

    beforeEach(async () => {
      testGroup = await groupService.createGroup(mockUser.id, {
        name: '更新テストグループ',
        description: '更新前の説明',
        groupType: 'free',
      })
    })

    it('オーナーはグループ情報を更新できる', async () => {
      const updateData = {
        name: '更新後のグループ名',
        description: '更新後の説明文',
        memberLimit: 50,
      }

      const result = await groupService.updateGroup(
        mockUser.id,
        testGroup.id,
        updateData
      )

      expect(result).toBeDefined()
      expect(result.name).toBe(updateData.name)
      expect(result.description).toBe(updateData.description)
      expect(result.memberLimit).toBe(50)
    })

    it('メンバー上限を現在のメンバー数より少なくできない', async () => {
      // メンバーを追加
      await groupService.joinGroup(mockUser2.id, testGroup.id)

      const updateData = {
        memberLimit: 1, // 現在2名いるのに1名に制限
      }

      await expect(
        groupService.updateGroup(mockUser.id, testGroup.id, updateData)
      ).rejects.toThrow('メンバー上限は現在のメンバー数より少なくできません')
    })

    it('オーナー以外はグループ情報を更新できない', async () => {
      await groupService.joinGroup(mockUser2.id, testGroup.id)

      const updateData = {
        name: '勝手に変更',
      }

      await expect(
        groupService.updateGroup(mockUser2.id, testGroup.id, updateData)
      ).rejects.toThrow('グループオーナーのみが情報を更新できます')
    })
  })
})