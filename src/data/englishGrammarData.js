export const englishGrammarData = [
  // 1. TỪ LOẠI (PARTS OF SPEECH)
  {
    id: "nouns_count_uncount",
    category: "Từ loại",
    title: "Danh từ Đếm được & Không đếm được (Countable vs Uncountable Nouns)",
    formula: "Many + Countable Nouns  |  Much + Uncountable Nouns",
    meaning: "Phân biệt danh từ đếm được (có dạng số nhiều thêm s/es) và danh từ không đếm được (không đi với a/an, không có dạng số nhiều).",
    usage: "Danh từ đếm được đi kèm a/an/numbers. Danh từ không đếm được đi kèm some/any/much/little.",
    examples: [
      { en: "I bought three books and some milk.", vi: "Tôi đã mua ba cuốn sách và một ít sữa (sách đếm được, sữa không đếm được)." },
      { en: "How much information do you need?", vi: "Bạn cần bao nhiêu thông tin? (information là danh từ không đếm được)." }
    ]
  },
  {
    id: "possessive_nouns",
    category: "Từ loại",
    title: "Sở hữu cách (Possessive Nouns)",
    formula: "Singular Noun + 's  |  Plural Noun ending in s + '",
    meaning: "Diễn tả quyền sở hữu hoặc mối quan hệ giữa một người/vật với một người/vật khác.",
    usage: "Thêm 's vào sau danh từ số ít. Đối với danh từ số nhiều tận cùng bằng s, chỉ cần thêm dấu nháy đơn '. Với vật dùng 'of'.",
    examples: [
      { en: "This is My's laptop.", vi: "Đây là máy tính xách tay của My." },
      { en: "The students' room is down the hall.", vi: "Phòng của các học sinh ở cuối hành lang." }
    ]
  },
  {
    id: "pronouns_all",
    category: "Từ loại",
    title: "Đại từ Sở hữu & Phản thân (Possessive & Reflexive Pronouns)",
    formula: "Possessive: Mine, Yours, His, Hers, Ours, Theirs  |  Reflexive: Myself, Yourself, Himself, Ourselves",
    meaning: "Đại từ sở hữu dùng để thay thế cho Tính từ sở hữu + Danh từ nhằm tránh lặp từ. Đại từ phản thân dùng khi chủ ngữ và tân ngữ cùng chỉ một đối tượng.",
    usage: "Ví dụ: 'My book' -> 'Mine'. 'I cut myself' -> Tôi tự làm đứt tay.",
    examples: [
      { en: "Your car is fast, but mine is faster.", vi: "Xe của bạn nhanh đấy, nhưng xe của tôi (mine = my car) còn nhanh hơn." },
      { en: "He prepared the dinner himself.", vi: "Anh ấy tự mình chuẩn bị bữa tối." }
    ]
  },
  {
    id: "modal_verbs",
    category: "Từ loại",
    title: "Động từ Khuyết thiếu (Modal Verbs)",
    formula: "S + Modal Verb (Can/Could/Must/Should/May/Might) + V-inf",
    meaning: "Diễn tả khả năng, sự bắt buộc, lời khuyên, sự cho phép hoặc khả năng xảy ra của một sự việc.",
    usage: "Sau động từ khuyết thiếu luôn là động từ nguyên mẫu không 'to'. Không chia theo ngôi.",
    examples: [
      { en: "You must wear a helmet when riding a motorbike.", vi: "Bạn bắt buộc phải đội mũ bảo hiểm khi đi xe máy." },
      { en: "You should practice speaking English every day.", vi: "Bạn nên luyện nói tiếng Anh hàng ngày." }
    ]
  },
  {
    id: "linking_verbs",
    category: "Từ loại",
    title: "Động từ Nối (Linking Verbs)",
    formula: "S + Linking Verb (Become/Seem/Feel/Taste/Look/Smell) + Adj",
    meaning: "Kết nối chủ ngữ với tính từ chỉ tính chất, trạng thái của chủ ngữ (không dùng với trạng từ).",
    usage: "Khác với động từ hành động đi với trạng từ, động từ nối đi kèm trực tiếp với tính từ.",
    examples: [
      { en: "This soup tastes delicious.", vi: "Món súp này ăn thử thấy rất ngon." },
      { en: "She feels tired after a long work day.", vi: "Cô ấy cảm thấy mệt mỏi sau một ngày làm việc dài." }
    ]
  },
  {
    id: "adj_order",
    category: "Từ loại",
    title: "Thứ tự Tính từ (Adjective Order - OSASCOMP)",
    formula: "Opinion - Size - Age - Shape - Color - Origin - Material - Purpose + N",
    meaning: "Quy tắc sắp xếp thứ tự các tính từ đứng trước bổ nghĩa cho một danh từ.",
    usage: "Ý kiến (ugly, nice) -> Kích thước (big) -> Tuổi tác (old) -> Hình dáng (round) -> Màu sắc (red) -> Nguồn gốc (Japanese) -> Chất liệu (wooden) -> Mục đích (sleeping bag).",
    examples: [
      { en: "She bought a beautiful small old black Japanese wooden table.", vi: "Cô ấy đã mua một chiếc bàn bằng gỗ Nhật Bản, màu đen, cũ, nhỏ, rất đẹp." },
      { en: "It is an interesting old French movie.", vi: "Đó là một bộ phim Pháp cổ rất hay." }
    ]
  },
  {
    id: "adj_ing_ed",
    category: "Từ loại",
    title: "Tính từ đuôi -ing và -ed (Participle Adjectives)",
    formula: "V-ing (chủ động, bản chất)  |  V-ed (bị động, cảm xúc bị tác động)",
    meaning: "Phân biệt tính từ chỉ bản chất của sự vật/người (-ing) và cảm xúc của một đối tượng bị tác động bởi hoàn cảnh (-ed).",
    usage: "Ví dụ: Cuốn sách thú vị (The book is interesting) khiến tôi cảm thấy thích thú (I am interested in the book).",
    examples: [
      { en: "The long lecture was very boring.", vi: "Bài giảng dài đó vô cùng nhàm chán (chỉ bản chất)." },
      { en: "The students were bored during the long lecture.", vi: "Các học sinh cảm thấy chán nản trong suốt bài giảng dài (chỉ cảm xúc học sinh)." }
    ]
  },
  {
    id: "articles_determiners",
    category: "Từ loại",
    title: "Mạo từ (Articles - A, An, The)",
    formula: "A/An + Singular Countable (chưa xác định)  |  The + Noun (đã xác định/độc nhất)",
    meaning: "Sử dụng mạo từ xác định 'The' hoặc không xác định 'A/An' tùy thuộc vào việc đối tượng đã được biết đến hay chưa.",
    usage: "'An' đứng trước các từ bắt đầu bằng nguyên âm phát âm (u, e, o, a, i). 'The' dùng khi cả người nói và nghe đều biết rõ vật đó.",
    examples: [
      { en: "I saw an elephant at the zoo. The elephant was massive.", vi: "Tôi đã thấy một con voi ở sở thú. Con voi đó (đã xác định ở câu trước) rất to lớn." },
      { en: "The moon revolves around the Earth.", vi: "Mặt trăng quay quanh Trái đất (các vật thể độc nhất)." }
    ]
  },
  {
    id: "conjunctions_coordinating",
    category: "Từ loại",
    title: "Liên từ kết hợp (Coordinating Conjunctions - FANBOYS)",
    formula: "Clause 1, + (For / And / Nor / But / Or / Yet / So) + Clause 2",
    meaning: "Dùng để nối các từ, cụm từ hoặc các mệnh đề độc lập có vai trò ngữ pháp tương đương.",
    usage: "Sử dụng dấu phẩy trước liên từ khi nối hai mệnh đề độc lập.",
    examples: [
      { en: "I wanted to go for a walk, but it started to rain.", vi: "Tôi muốn đi dạo, nhưng trời lại đổ mưa." },
      { en: "She did not study hard, so she failed the exam.", vi: "Cô ấy không học hành chăm chỉ, vì vậy cô ấy đã trượt kỳ thi." }
    ]
  },

  // 2. CÁC THÌ TRONG TIẾNG ANH (TENSES)
  {
    id: "tense_pres_simple",
    category: "Các thì",
    title: "Hiện tại đơn (Present Simple)",
    formula: "S + V(s/es) + O  |  S + am/is/are + N/Adj",
    meaning: "Diễn tả thói quen, hành động lặp đi lặp lại ở hiện tại, hoặc một sự thật hiển nhiên.",
    usage: "Thêm s/es vào động từ khi chủ ngữ là ngôi thứ 3 số ít (He/She/It).",
    examples: [
      { en: "Water boils at 100 degrees Celsius.", vi: "Nước sôi ở 100 độ C (sự thật hiển nhiên)." },
      { en: "He plays tennis every Sunday morning.", vi: "Anh ấy chơi quần vợt vào mỗi sáng Chủ nhật." }
    ]
  },
  {
    id: "tense_pres_cont",
    category: "Các thì",
    title: "Hiện tại tiếp diễn (Present Continuous)",
    formula: "S + am/is/are + V-ing + O",
    meaning: "Diễn tả hành động đang diễn ra ngay tại thời điểm nói hoặc một kế hoạch chắc chắn trong tương lai gần.",
    usage: "Thường đi kèm: now, at the moment, currently, right now.",
    examples: [
      { en: "We are preparing for our English exam now.", vi: "Hiện tại chúng tôi đang chuẩn bị cho kỳ thi tiếng Anh." },
      { en: "She is meeting her doctor tomorrow afternoon.", vi: "Cô ấy sẽ gặp bác sĩ vào chiều mai (kế hoạch chắc chắn)." }
    ]
  },
  {
    id: "tense_pres_perf",
    category: "Các thì",
    title: "Hiện tại hoàn thành (Present Perfect)",
    formula: "S + have/has + V3/ed + O",
    meaning: "Diễn tả hành động đã xảy ra trong quá khứ nhưng kết quả hoặc ảnh hưởng vẫn liên quan đến hiện tại.",
    usage: "Dùng với: since (mốc thời gian), for (khoảng thời gian), already, yet, ever, never.",
    examples: [
      { en: "I have traveled to Tokyo twice.", vi: "Tôi đã từng đi du lịch đến Tokyo hai lần." },
      { en: "She hasn't finished writing the report yet.", vi: "Cô ấy vẫn chưa hoàn thành việc viết báo cáo." }
    ]
  },
  {
    id: "tense_pres_perf_cont",
    category: "Các thì",
    title: "Hiện tại hoàn thành tiếp diễn (Present Perfect Continuous)",
    formula: "S + have/has + been + V-ing + O",
    meaning: "Nhấn mạnh tính liên tục, kéo dài của hành động bắt đầu trong quá khứ và vẫn tiếp diễn ở hiện tại.",
    usage: "Thường dùng để trả lời cho câu hỏi 'How long...?' hoặc nhấn mạnh sự mệt mỏi/kết quả thấy rõ ở hiện tại.",
    examples: [
      { en: "I have been learning English for three hours, my eyes are tired.", vi: "Tôi đã học tiếng Anh liên tục suốt ba tiếng rồi, mắt tôi đang mỏi rã rời." },
      { en: "It has been raining all day.", vi: "Trời đã mưa ròng rã suốt cả ngày nay." }
    ]
  },
  {
    id: "tense_past_simple",
    category: "Các thì",
    title: "Quá khứ đơn (Past Simple)",
    formula: "S + V2/ed + O  |  S + was/were + N/Adj",
    meaning: "Diễn tả hành động đã xảy ra, kết thúc hoàn toàn và biết rõ thời gian trong quá khứ.",
    usage: "Từ nhận biết: yesterday, ago, last year, in + năm quá khứ.",
    examples: [
      { en: "She graduated from university in 2022.", vi: "Cô ấy đã tốt nghiệp đại học vào năm 2022." },
      { en: "Did you watch the football match last night?", vi: "Bạn có xem trận bóng đá tối qua không?" }
    ]
  },
  {
    id: "tense_past_cont",
    category: "Các thì",
    title: "Quá khứ tiếp diễn (Past Continuous)",
    formula: "S + was/were + V-ing + O",
    meaning: "Diễn tả một hành động đang xảy ra tại một thời điểm cụ thể trong quá khứ, hoặc hai hành động song song xảy ra trong quá khứ.",
    usage: "Dùng 'while' cho hai hành động song song, 'when' khi một hành động đang xảy ra thì hành động khác cắt ngang.",
    examples: [
      { en: "I was reading a book when she called.", vi: "Tôi đang đọc sách thì cô ấy gọi điện đến." },
      { en: "While My was cooking dinner, Nam was playing games.", vi: "Trong lúc My đang nấu bữa tối thì Nam đang chơi game." }
    ]
  },
  {
    id: "tense_past_perf",
    category: "Các thì",
    title: "Quá khứ hoàn thành (Past Perfect)",
    formula: "S + had + V3/ed + O",
    meaning: "Diễn tả một hành động đã hoàn thành trước một thời điểm hoặc một hành động khác trong quá khứ.",
    usage: "Hành động xảy ra trước dùng Quá khứ hoàn thành, hành động sau dùng Quá khứ đơn.",
    examples: [
      { en: "When we arrived at the cinema, the movie had already started.", vi: "Khi chúng tôi đến rạp chiếu phim, bộ phim đã bắt đầu chiếu rồi." },
      { en: "He had checked the document carefully before he sent it.", vi: "Anh ấy đã kiểm tra tài liệu cẩn thận trước khi gửi nó đi." }
    ]
  },
  {
    id: "tense_fut_simple",
    category: "Các thì",
    title: "Tương lai đơn (Future Simple)",
    formula: "S + will + V-inf + O",
    meaning: "Diễn tả quyết định đưa ra ngay tại thời điểm nói, lời hứa, dự đoán không có căn cứ.",
    usage: "Dùng khi nảy sinh ý định tức thời hoặc đưa ra nhận định chủ quan (I think, I promise...).",
    examples: [
      { en: "Hold on, I will open the door for you.", vi: "Chờ chút, tôi sẽ ra mở cửa cho bạn." },
      { en: "I promise I will not tell anyone your secret.", vi: "Tôi hứa tôi sẽ không kể cho ai nghe bí mật của bạn." }
    ]
  },
  {
    id: "tense_near_future",
    category: "Các thì",
    title: "Tương lai gần (Near Future - Be going to)",
    formula: "S + am/is/are + going to + V-inf",
    meaning: "Diễn tả một dự định, kế hoạch đã lên lịch sẵn, hoặc một dự đoán có căn cứ, dấu hiệu ở hiện tại.",
    usage: "Khác với 'will', 'be going to' nhấn mạnh kế hoạch có trước hoặc dấu hiệu rõ ràng trước mắt.",
    examples: [
      { en: "Look at those dark clouds! It is going to rain.", vi: "Hãy nhìn những đám mây đen kia kìa! Trời sắp mưa rồi đấy." },
      { en: "We are going to buy a new house next month.", vi: "Chúng tôi dự định sẽ mua một ngôi nhà mới vào tháng sau." }
    ]
  },
  {
    id: "tense_fut_perf",
    category: "Các thì",
    title: "Tương lai hoàn thành (Future Perfect)",
    formula: "S + will + have + V3/ed + O",
    meaning: "Diễn tả một hành động sẽ hoàn thành trước một thời điểm hoặc một hành động khác trong tương lai.",
    usage: "Thường đi kèm cụm từ: By the time + hiện tại đơn, By + mốc thời gian tương lai.",
    examples: [
      { en: "By the end of this year, I will have finished my English course.", vi: "Tính đến cuối năm nay, tôi sẽ hoàn thành xong khóa học tiếng Anh của mình." },
      { en: "They will have built the bridge by next summer.", vi: "Họ sẽ xây xong cây cầu trước mùa hè năm sau." }
    ]
  },

  // 3. CẤU TRÚC CÂU & CẤU TRÚC NÂNG CAO (SENTENCE STRUCTURES)
  {
    id: "passive_voice",
    category: "Cấu trúc nâng cao",
    title: "Câu bị động (Passive Voice)",
    formula: "S + be + V3/ed + (by O)",
    meaning: "Nhấn mạnh đối tượng nhận hành động thay vì chủ thể thực hiện hành động.",
    usage: "Động từ 'be' được chia theo thì của động từ chính trong câu chủ động.",
    examples: [
      { en: "My smartphone was stolen yesterday.", vi: "Điện thoại thông minh của tôi đã bị trộm ngày hôm qua." },
      { en: "This classroom is cleaned every morning.", vi: "Lớp học này được dọn dẹp vào mỗi buổi sáng." }
    ]
  },
  {
    id: "passive_impersonal",
    category: "Cấu trúc nâng cao",
    title: "Câu bị động khách quan (Impersonal Passive)",
    formula: "It + is + said/believed/thought + that + S + V  |  S + is + said + to V / to have V3",
    meaning: "Dùng để truyền đạt ý kiến, tin đồn, nhận định chung của mọi người về một vấn đề nào đó.",
    usage: "Ví dụ: 'People say that he is rich' -> 'He is said to be rich'.",
    examples: [
      { en: "It is believed that eating vegetables is good for health.", vi: "Người ta tin rằng ăn rau xanh rất tốt cho sức khỏe." },
      { en: "He is said to have escaped from the country.", vi: "Anh ấy được cho là đã trốn thoát khỏi đất nước." }
    ]
  },
  {
    id: "conditionals_type123",
    category: "Cấu trúc nâng cao",
    title: "Ba câu điều kiện cơ bản (Conditionals Type 1, 2, 3)",
    formula: "L1: If + Pres, Will + V  |  L2: If + Past (were), Would + V  |  L3: If + Past Perfect, Would have V3",
    meaning: "Loại 1: Có thật ở tương lai. Loại 2: Giả định trái với hiện tại. Loại 3: Giả định tiếc nuối trong quá khứ.",
    usage: "Lưu ý động từ to be ở Loại 2 luôn chia là 'were' cho mọi chủ ngữ.",
    examples: [
      { en: "If I find your wallet, I will send you a message.", vi: "Nếu tôi tìm thấy ví của bạn, tôi sẽ gửi tin nhắn cho bạn (Loại 1)." },
      { en: "If I had wings, I would fly back home immediately.", vi: "Nếu tôi có cánh, tôi sẽ bay về nhà ngay lập tức (Loại 2)." }
    ]
  },
  {
    id: "conditionals_mixed",
    category: "Cấu trúc nâng cao",
    title: "Câu điều kiện hỗn hợp (Mixed Conditionals)",
    formula: "If + S + had + V3/ed (Quá khứ), S + would + V-inf (Hiện tại)",
    meaning: "Giả định một hành động không có thật trong quá khứ dẫn đến kết quả trái với hiện tại.",
    usage: "Vế If chia giống loại 3, vế kết quả chia giống loại 2.",
    examples: [
      { en: "If I had won the lottery yesterday, I would be rich now.", vi: "Nếu hôm qua tôi trúng số độc đắc thì bây giờ tôi đã giàu rồi." },
      { en: "If she had taken my advice, she wouldn't be in trouble today.", vi: "Nếu cô ấy nghe lời khuyên của tôi lúc đó thì hôm nay cô ấy đã không gặp rắc rối." }
    ]
  },
  {
    id: "reported_speech",
    category: "Cấu trúc nâng cao",
    title: "Câu gián tiếp / Câu tường thuật (Reported Speech)",
    formula: "S + said (that) + S + V (Lùi thì) + (Đổi trạng từ chỉ thời gian/nơi chốn)",
    meaning: "Thuật lại lời nói của một người khác mà không dùng từ nguyên văn của họ.",
    usage: "Quy tắc lùi thì: Hiện tại đơn -> Quá khứ đơn, Hiện tại hoàn thành -> Quá khứ hoàn thành. Đổi 'here' -> 'there', 'tomorrow' -> 'the next day'.",
    examples: [
      { en: "He said, 'I am tired today.' -> He said that he was tired that day.", vi: "Anh ấy nói: 'Hôm nay tôi mệt.' -> Anh ấy nói rằng anh ấy mệt vào ngày hôm đó." },
      { en: "She asked me, 'Where do you live?' -> She asked me where I lived.", vi: "Cô ấy hỏi tôi: 'Bạn sống ở đâu?' -> Cô ấy hỏi tôi sống ở đâu." }
    ]
  },
  {
    id: "comparisons_double",
    category: "Cấu trúc nâng cao",
    title: "So sánh kép (Double Comparison - Càng... thì càng...)",
    formula: "The + Comparative (hơn) + S + V, The + Comparative (hơn) + S + V",
    meaning: "Mô tả sự thay đổi đồng thời của hai sự việc, sự việc này tăng/giảm kéo theo sự việc kia tăng/giảm.",
    usage: "Dùng tính từ ngắn thêm -er hoặc 'more + tính từ dài' sau chữ The.",
    examples: [
      { en: "The harder you study, the better your grades will be.", vi: "Bạn càng học chăm chỉ, điểm số của bạn sẽ càng tốt hơn." },
      { en: "The more expensive the hotel is, the better the service is.", vi: "Khách sạn càng đắt tiền thì dịch vụ càng tốt." }
    ]
  },
  {
    id: "relative_clauses_defining",
    category: "Cấu trúc nâng cao",
    title: "Mệnh đề quan hệ xác định & không xác định (Relative Clauses)",
    formula: "N (Người) + Who/Whom/Whose  |  N (Vật) + Which/That",
    meaning: "Dùng để giải thích hoặc định nghĩa rõ hơn về danh từ đi trước. Mệnh đề không xác định cần có dấu phẩy ngăn cách và không dùng 'That'.",
    usage: "Who thế chủ ngữ chỉ người, Whom thế tân ngữ chỉ người, Whose chỉ sở hữu cách.",
    examples: [
      { en: "The girl who called you yesterday is my sister.", vi: "Cô gái người mà gọi điện cho bạn hôm qua là em gái tôi (Mệnh đề xác định)." },
      { en: "Hanoi, which is the capital of Vietnam, is a beautiful city.", vi: "Hà Nội, thủ đô của Việt Nam, là một thành phố rất đẹp (Mệnh đề không xác định)." }
    ]
  },
  {
    id: "relative_clauses_reduction",
    category: "Cấu trúc nâng cao",
    title: "Rút gọn mệnh đề quan hệ (Reduced Relative Clauses)",
    formula: "Active -> V-ing  |  Passive -> V3/ed  |  The first/only -> To-V",
    meaning: "Rút ngắn mệnh đề quan hệ bằng cách lược bỏ đại từ quan hệ và động từ to be.",
    usage: "Rút gọn về V-ing nếu chủ động, V3 nếu bị động, To-V nếu danh từ đi trước có 'the first, the second, the last, the only'.",
    examples: [
      { en: "The boy who is playing soccer is Nam. -> The boy playing soccer is Nam.", vi: "Cậu bé đang chơi đá bóng là Nam." },
      { en: "The book which was written by Jack is famous. -> The book written by Jack is famous.", vi: "Cuốn sách được viết bởi Jack rất nổi tiếng." }
    ]
  },
  {
    id: "subjunctive_wish",
    category: "Cấu trúc nâng cao",
    title: "Câu ước giả định (Wish & If only)",
    formula: "Wish ở hiện tại: S + wish + S + V2/ed  |  Wish quá khứ: S + wish + S + had V3/ed",
    meaning: "Diễn tả mong muốn trái ngược với thực tế ở hiện tại hoặc quá khứ.",
    usage: "'If only' có thể dùng thay cho 'S + wish' để nhấn mạnh mong muốn mạnh mẽ hơn.",
    examples: [
      { en: "I wish I were taller.", vi: "Tôi ước gì mình cao hơn (thực tế tôi thấp)." },
      { en: "She wishes she had not bought that expensive dress yesterday.", vi: "Cô ấy ước gì hôm qua cô ấy không mua chiếc váy đắt đỏ đó (tiếc nuối quá khứ)." }
    ]
  },
  {
    id: "subjunctive_would_rather",
    category: "Cấu trúc nâng cao",
    title: "Cấu trúc giả định 'Would rather' (Thích... hơn)",
    formula: "S1 + would rather + S2 + V2/ed (trái hiện tại)  |  S1 + would rather + S2 + had V3 (trái quá khứ)",
    meaning: "Diễn tả mong muốn của một người đối với hành động của một người khác.",
    usage: "Nếu chỉ có một chủ thể tự thích làm gì, dùng: S + would rather + V-inf (+ than + V-inf).",
    examples: [
      { en: "I would rather you didn't smoke in here.", vi: "Tôi muốn bạn không hút thuốc ở trong này (lời yêu cầu lịch sự)." },
      { en: "I would rather stay at home than go out tonight.", vi: "Tôi thích ở nhà hơn là đi chơi tối nay." }
    ]
  },
  {
    id: "subjunctive_its_time",
    category: "Cấu trúc nâng cao",
    title: "Cấu trúc 'It's time' (Đã đến lúc làm gì)",
    formula: "It is time + S + V2/ed  |  It is time + (for sb) + to + V-inf",
    meaning: "Diễn tả một việc đáng lẽ ra nên được thực hiện sớm hơn hoặc ngay tại thời điểm hiện tại.",
    usage: "Thường dùng 'It is high time' hoặc 'It is about time' để tăng tính nhấn mạnh.",
    examples: [
      { en: "It is time we went home. It's getting dark.", vi: "Đã đến lúc chúng ta phải về nhà rồi. Trời đang tối dần." },
      { en: "It's time for the children to go to bed.", vi: "Đã đến lúc trẻ con phải đi ngủ." }
    ]
  },
  {
    id: "inversion_negative",
    category: "Cấu trúc nâng cao",
    title: "Đảo ngữ với trạng từ phủ định (Inversion with Negative Adverbs)",
    formula: "Trạng từ phủ định (Never/Rarely/Seldom/Little) + Trợ động từ + S + V-inf",
    meaning: "Nhấn mạnh mức độ hiếm khi hoặc hầu như không của một hành động.",
    usage: "Đưa trợ động từ (do/does/did/has/have/can...) lên trước chủ ngữ khi từ phủ định đứng đầu câu.",
    examples: [
      { en: "Never in my life have I seen such a beautiful view.", vi: "Chưa bao giờ trong đời tôi được nhìn thấy phong cảnh đẹp như thế này." },
      { en: "Seldom does he talk about his family.", vi: "Hiếm khi anh ấy kể chuyện về gia đình mình." }
    ]
  },
  {
    id: "inversion_only",
    category: "Cấu trúc nâng cao",
    title: "Đảo ngữ với cấu trúc 'Only' (Chỉ khi... thì...)",
    formula: "Only after / Only when + Clause 1, Trợ động từ + S + Clause 2",
    meaning: "Nhấn mạnh điều kiện tiên quyết: Chỉ sau khi hoặc chỉ khi sự việc 1 xảy ra thì sự việc 2 mới xảy ra.",
    usage: "Lưu ý đảo ngữ ở mệnh đề thứ hai, không đảo ở mệnh đề chứa Only.",
    examples: [
      { en: "Only when you grow up will you understand this.", vi: "Chỉ khi con lớn lên thì con mới hiểu được điều này." },
      { en: "Only by studying hard can you pass this difficult exam.", vi: "Chỉ bằng cách học tập chăm chỉ bạn mới có thể đỗ kỳ thi khó này." }
    ]
  },
  {
    id: "question_tags",
    category: "Cấu trúc nâng cao",
    title: "Câu hỏi đuôi (Question Tags)",
    formula: "Positive Statement, + Negative Tag?  |  Negative Statement, + Positive Tag?",
    meaning: "Dùng để xác nhận lại thông tin xem có đúng hay không hoặc tìm kiếm sự đồng thuận.",
    usage: "Sử dụng trợ động từ của câu chính để tạo đuôi. Một số trường hợp đặc biệt: I am -> aren't I? Let's -> shall we? Everyone -> they.",
    examples: [
      { en: "You like learning English, don't you?", vi: "Bạn thích học tiếng Anh, có phải không?" },
      { en: "He hasn't finished the task, has he?", vi: "Anh ấy vẫn chưa hoàn thành nhiệm vụ phải không?" }
    ]
  },

  // 4. CỤM TỪ & MẪU CÂU ỨNG DỤNG (PHRASES & PATTERNS)
  {
    id: "phrasal_verbs",
    category: "Cụm từ ứng dụng",
    title: "Cụm động từ phổ biến (Phrasal Verbs)",
    formula: "Verb + Preposition/Adverb",
    meaning: "Sự kết hợp giữa một động từ và một giới từ/trạng từ tạo ra một nghĩa hoàn toàn mới khác biệt so với động từ gốc.",
    usage: "Một số cụm từ thông dụng: look after (chăm sóc), give up (bỏ cuộc), run out of (hết sạch).",
    examples: [
      { en: "She looks after her younger brother on weekends.", vi: "Cô ấy chăm sóc em trai mình vào những ngày cuối tuần." },
      { en: "We have run out of coffee, I need to buy some.", vi: "Chúng tôi đã hết sạch cà phê rồi, tôi cần phải đi mua thêm ít nữa." }
    ]
  },
  {
    id: "gerund_infinitive",
    category: "Cụm từ ứng dụng",
    title: "Danh động từ & Động từ nguyên mẫu (Gerund vs Infinitive)",
    formula: "V + V-ing (avoid/mind/enjoy...)  |  V + To-V (decide/hope/want...)",
    meaning: "Quy tắc sử dụng dạng V-ing hay To-V sau một số động từ cụ thể trong tiếng Anh.",
    usage: "Một số từ thay đổi nghĩa như: Remember + To-V (nhớ phải làm gì), Remember + V-ing (nhớ đã làm gì trong quá khứ).",
    examples: [
      { en: "I decided to join the English speaking club.", vi: "Tôi đã quyết định tham gia câu lạc bộ nói tiếng Anh." },
      { en: "He enjoys listening to music while cooking.", vi: "Anh ấy thích nghe nhạc trong khi nấu ăn." }
    ]
  },
  {
    id: "adverbial_clause_concession",
    category: "Cụm từ ứng dụng",
    title: "Mệnh đề trạng ngữ chỉ sự nhượng bộ (Although vs Despite)",
    formula: "Although / Even though + Clause  |  Despite / In spite of + Noun / V-ing",
    meaning: "Diễn tả sự đối lập, nhượng bộ giữa hai sự việc trong câu (Mặc dù... nhưng...).",
    usage: "Không dùng 'but' trong câu có Although/Even though.",
    examples: [
      { en: "Although it rained heavily, they still went soccer playing.", vi: "Mặc dù trời mưa to, họ vẫn đi đá bóng." },
      { en: "In spite of being tired, she completed her work.", vi: "Dù rất mệt mỏi, cô ấy vẫn hoàn thành công việc của mình." }
    ]
  },
  {
    id: "adverbial_clause_reason",
    category: "Cụm từ ứng dụng",
    title: "Mệnh đề trạng ngữ chỉ nguyên nhân (Because vs Because of)",
    formula: "Because / Since / As + Clause  |  Because of / Due to + Noun / V-ing",
    meaning: "Diễn tả nguyên nhân của một sự việc (Bởi vì...).",
    usage: "Because đi kèm một mệnh đề có đầy đủ chủ ngữ và vị ngữ. Because of đi với một danh từ hoặc danh động từ.",
    examples: [
      { en: "I stayed at home because it was freezing cold outside.", vi: "Tôi ở nhà bởi vì thời tiết bên ngoài lạnh buốt." },
      { en: "Due to the heavy traffic, I arrived late for the meeting.", vi: "Do tắc nghẽn giao thông, tôi đã đến họp muộn." }
    ]
  }
];
