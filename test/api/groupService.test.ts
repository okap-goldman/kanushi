import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { groups, groupMembers, groupChats } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { User } from '@supabase/supabase-js'

// vi.mockはトップレベルで定義する必要がある
vi.mock('@/lib/db/client', () => {
  // テスト用のデータストア
  const testGroups: any[] = []
  const testMembers: any[] = []
  const testMessages: any[] = []

  const mockDb = {
    transaction: vi.fn().mockImplementation(async (callback: any) => {
      return callback(mockDb)
    }),
    insert: vi.fn().mockImplementation((table: any) => ({
      values: vi.fn().mockImplementation((data: any) => ({
        returning: vi.fn().mockImplementation(() => {
          if (table.config?.name === 'group') {
            const group = { ...data, id: data.id || nanoid() }
            testGroups.push(group)
            return Promise.resolve([group])
          } else if (table.config?.name === 'group_member') {
            const member = { ...data, id: data.id || nanoid() }
            testMembers.push(member)
            return Promise.resolve([member])
          } else if (table.config?.name === 'group_chat') {
            const message = { ...data, id: data.id || nanoid() }
            testMessages.push(message)
            return Promise.resolve([message])
          }
          return Promise.resolve([])
        })
      }))
    })),
    select: vi.fn().mockImplementation((fields?: any) => {
      if (fields && fields.count) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockImplementation(() => ({
            execute: vi.fn().mockResolvedValue([{ 
              count: testMembers.filter((m: any) => m.status === 'active').length 
            }])
          }))
        }
      }
      return {
        from: vi.fn().mockImplementation((table: any) => ({
          where: vi.fn().mockImplementation(() => ({
            execute: vi.fn().mockImplementation(() => {
              if (table.config?.name === 'group') {
                return Promise.resolve(testGroups)
              } else if (table.config?.name === 'group_member') {
                return Promise.resolve(testMembers)
              } else if (table.config?.name === 'group_chat') {
                return Promise.resolve(testMessages)
              }
              return Promise.resolve([])
            }),
            orderBy: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
          })),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([])
        }))
      }
    }),
    update: vi.fn().mockImplementation((table: any) => ({
      set: vi.fn().mockImplementation((data: any) => ({
        where: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockImplementation(() => {
            if (table.config?.name === 'group_member') {
              // メンバーのステータス更新をシミュレート
              for (let i = 0; i < testMembers.length; i++) {
                testMembers[i] = { ...testMembers[i], ...data }
              }
            }
            return Promise.resolve()
          }),
          returning: vi.fn().mockImplementation(() => {
            return Promise.resolve([{ ...data }])
          })
        }))
      }))
    })),
    delete: vi.fn().mockReturnThis(),
    _testData: {
      groups: testGroups,
      members: testMembers,
      messages: testMessages,
      reset: () => {
        testGroups.length = 0
        testMembers.length = 0
        testMessages.length = 0
      },
      setSelectMock: (fn: any) => {
        mockDb.select = fn
      }
    }
  }

  return { db: mockDb }
})

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
  let mockDb: any

  beforeEach(async () => {
    const { db } = await import('@/lib/db/client')
    mockDb = db as any
    
    // モックをリセット
    vi.clearAllMocks()
    // テストデータをクリア
    mockDb._testData.reset()
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
      expect(mockDb._testData.members).toHaveLength(1)
      expect(mockDb._testData.members[0].userId).toBe(mockUser.id)
      expect(mockDb._testData.members[0].role).toBe('owner')
      expect(mockDb._testData.members[0].status).toBe('active')
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
      
      // selectの動作を調整
      mockDb._testData.setSelectMock(vi.fn().mockImplementation((fields?: any) => {
        const testData = mockDb._testData
        
        if (fields && fields.count) {
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockImplementation(() => ({
              execute: vi.fn().mockResolvedValue([{ 
                count: testData.members.filter((m: any) => 
                  m.groupId === testGroup.id && m.status === 'active'
                ).length 
              }])
            }))
          }
        }
        return {
          from: vi.fn().mockImplementation((table: any) => ({
            where: vi.fn().mockImplementation(() => ({
              execute: vi.fn().mockImplementation(() => {
                if (table.config?.name === 'group') {
                  return Promise.resolve(
                    testData.groups.filter((g: any) => g.id === testGroup.id)
                  )
                } else if (table.config?.name === 'group_member') {
                  return Promise.resolve(
                    testData.members.filter((m: any) => 
                      m.groupId === testGroup.id && m.userId === mockUser2.id
                    )
                  )
                }
                return Promise.resolve([])
              })
            }))
          }))
        }
      }))
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

      // selectの動作を調整（上限チェック用）
      mockDb._testData.setSelectMock(vi.fn().mockImplementation((fields?: any) => {
        if (fields && fields.count) {
          return {
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockImplementation(() => ({
              execute: vi.fn().mockResolvedValue([{ count: 2 }]) // 既に上限
            }))
          }
        }
        return {
          from: vi.fn().mockImplementation((table: any) => ({
            where: vi.fn().mockImplementation(() => ({
              execute: vi.fn().mockImplementation(() => {
                if (table.config?.name === 'group') {
                  return Promise.resolve([limitedGroup])
                }
                return Promise.resolve([])
              })
            }))
          }))
        }
      }))

      // 2人目の参加試行
      const mockUser3 = { ...mockUser, id: 'user789' }
      await expect(
        groupService.joinGroup(mockUser3.id, limitedGroup.id)
      ).rejects.toThrow('グループのメンバー数が上限に達しています')
    })

    it('存在しないグループには参加できない', async () => {
      // 存在しないグループ用のモック設定
      mockDb._testData.setSelectMock(vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockResolvedValue([]) // グループが見つからない
        }))
      })))

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
      
      // selectの動作を調整
      mockDb._testData.setSelectMock(vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation((table: any) => ({
          where: vi.fn().mockImplementation(() => ({
            execute: vi.fn().mockImplementation(() => {
              if (table.config?.name === 'group_member') {
                return Promise.resolve(
                  mockDb._testData.members.filter((m: any) => m.groupId === testGroup.id)
                )
              }
              return Promise.resolve([])
            })
          }))
        }))
      })))
    })

    it('一般メンバーはグループから退出できる', async () => {
      const result = await groupService.leaveGroup(mockUser2.id, testGroup.id)

      expect(result).toBe(true)
      
      // メンバーステータスが'left'になっているか確認
      const member = mockDb._testData.members.find((m: any) => 
        m.groupId === testGroup.id && m.userId === mockUser2.id
      )
      expect(member.status).toBe('left')
      expect(member.leftAt).toBeDefined()
    })

    it('オーナーはグループから退出できない', async () => {
      await expect(
        groupService.leaveGroup(mockUser.id, testGroup.id)
      ).rejects.toThrow('グループオーナーは退出できません')
    })

    it('参加していないグループからは退出できない', async () => {
      const mockUser3 = { ...mockUser, id: 'user789' }
      
      // メンバーでない場合のモック設定
      mockDb._testData.setSelectMock(vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockResolvedValue([]) // メンバーが見つからない
        }))
      })))

      await expect(
        groupService.leaveGroup(mockUser3.id, testGroup.id)
      ).rejects.toThrow('グループのメンバーではありません')
    })
  })
})