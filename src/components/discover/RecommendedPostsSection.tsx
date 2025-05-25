import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { ThumbsUp } from 'lucide-react-native';
import { Post } from '../post/Post';

// Sample data to be replaced with actual data from API/context
const SAMPLE_POSTS = [
  {
    id: '1',
    author: {
      id: '@kazu993_ascensionlife',
      name: 'かずぴー⭐︎ 【泉谷 和久】',
      image: 'https://scontent-nrt1-2.cdninstagram.com/v/t51.2885-19/468126137_550646691160354_2965217826538139290_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=scontent-nrt1-2.cdninstagram.com&_nc_cat=110&_nc_ohc=nAY3A92S-3AQ7kNvgE1YaUJ&_nc_gid=90caed4e6a1e4fa9972be8df42bad836&edm=AHzjunoBAAAA&ccb=7-5&oh=00_AYDfpayQHQFTDFpZ9AnPyDzebobzVOYneF01XEEOUM055g&oe=6776458A&_nc_sid=ba8368',
    },
    content: `11/22は婚姻のみの予定でしたが、
なんと風の時代学校の仲間達がサプライズセレモニーを開いてくださりました😭✨

誰かのこと本当の家族みたいだって思うようになるなんて、
半年前には考えたこともなかったです。
青梅に来て生まれ変わったなぁ。。

一人ひとりの仲間たちから、本当にたくさんの愛を受け取りながら毎日生きています。
お互いに気付き合いながら、最善に向かっていけるこの生き方が大好きです。
あなたがくれた愛が、僕を成長させてくれました。

僕は僕の在り方を通して、
いただいた豊かさを循環させ続けます。

いつも命を使って僕と関わってくださり、ありがとうございます。`,
    mediaType: 'text' as const,
    created_at: new Date().toISOString(),
    likes_count: 0,
    comments_count: 0,
  },
  {
    id: '2',
    author: {
      id: '@kazu993_ascensionlife',
      name: 'かずぴー⭐︎ 【泉谷 和久】',
      image: 'https://scontent-nrt1-2.cdninstagram.com/v/t51.2885-19/468126137_550646691160354_2965217826538139290_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=scontent-nrt1-2.cdninstagram.com&_nc_cat=110&_nc_ohc=nAY3A92S-3AQ7kNvgE1YaUJ&_nc_gid=90caed4e6a1e4fa9972be8df42bad836&edm=AHzjunoBAAAA&ccb=7-5&oh=00_AYDfpayQHQFTDFpZ9AnPyDzebobzVOYneF01XEEOUM055g&oe=6776458A&_nc_sid=ba8368',
    },
    content: 'https://mcdn.podbean.com/mf/web/5i9agca8msffjcfv/6b592.m4a',
    caption: '今日の瞑想音声です。心の平安を見つける瞑想の基礎について解説しています。',
    mediaType: 'audio' as const,
    created_at: new Date().toISOString(),
    likes_count: 0,
    comments_count: 0,
  },
  {
    id: '3',
    author: {
      id: '@kazu993_ascensionlife',
      name: 'かずぴー⭐︎ 【泉谷 和久】',
      image: 'https://scontent-nrt1-2.cdninstagram.com/v/t51.2885-19/468126137_550646691160354_2965217826538139290_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=scontent-nrt1-2.cdninstagram.com&_nc_cat=110&_nc_ohc=nAY3A92S-3AQ7kNvgE1YaUJ&_nc_gid=90caed4e6a1e4fa9972be8df42bad836&edm=AHzjunoBAAAA&ccb=7-5&oh=00_AYDfpayQHQFTDFpZ9AnPyDzebobzVOYneF01XEEOUM055g&oe=6776458A&_nc_sid=ba8368',
    },
    content: 'https://images.unsplash.com/photo-1532798442725-41036acc7489',
    caption: `今日の瞑想風景🌟 

宇宙とつながる特別な時間を過ごしました。
静寂の中で感じる無限の可能性。
みなさんも、自分だけの特別な瞑想空間を
見つけてみてください✨

#瞑想 #スピリチュアル #宇宙 #気づき`,
    mediaType: 'image' as const,
    created_at: new Date().toISOString(),
    likes_count: 0,
    comments_count: 0,
  }
];

export function RecommendedPostsSection() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingHorizontal: 16 }}>
        <ThumbsUp size={20} color="#000" />
        <Text style={{ fontSize: 18, fontWeight: '600' }}>おすすめ投稿</Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ gap: 16 }}>
          {SAMPLE_POSTS.map((post) => (
            <Post
              key={post.id}
              author={post.author}
              content={post.content}
              caption={post.caption}
              mediaType={post.mediaType}
              postId={post.id}
              tags={[]}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}