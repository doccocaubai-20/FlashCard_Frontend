export const dialoguesData = [
  {
    id: 'd1',
    title: 'Chào hỏi & Giới thiệu bản thân',
    level: 'HSK 1',
    description: 'Cuộc gặp gỡ tình cờ giữa Tiểu Minh và Tiểu Hoa tại thư viện trường học.',
    topics: ['Chào hỏi', 'Giới thiệu', 'Tên tuổi'],
    lines: [
      {
        speaker: 'A: Tiểu Minh',
        hanzi: '你好！请问你叫什么名字？',
        pinyin: 'Nǐ hǎo! Qǐngwèn nǐ jiào shénme míngzì?',
        meaning: 'Xin chào! Xin hỏi bạn tên là gì?',
        highlight: '名字 (míngzì - tên)',
        grammarLink: 'g2' // Trợ từ nghi vấn
      },
      {
        speaker: 'B: Tiểu Hoa',
        hanzi: '你好！我叫小华。你呢？',
        pinyin: 'Nǐ hǎo! Wǒ jiào Xiǎohuá. Nǐ ne?',
        meaning: 'Xin chào! Tôi tên là Tiểu Hoa. Còn bạn thì sao?',
        highlight: '你呢 (nǐ ne - còn bạn)',
        grammarLink: 'g17' // Câu hỏi với 呢
      },
      {
        speaker: 'A: Tiểu Minh',
        hanzi: '我叫小明。你是美国人吗？',
        pinyin: 'Wǒ jiào Xiǎomíng. Nǐ shì Měiguórén ma?',
        meaning: 'Tôi tên là Tiểu Minh. Bạn là người Mỹ phải không?',
        highlight: '美国人 (Měiguórén - người Mỹ)',
        grammarLink: 'g2' // Trợ từ 吗
      },
      {
        speaker: 'B: Tiểu Hoa',
        hanzi: '我不是美国人，我是英国人。你也是英国人吗？',
        pinyin: 'Wǒ bú shì Měiguórén, wǒ shì Yīngguórén. Nǐ yě shì Yīngguórén ma?',
        meaning: 'Tôi không phải người Mỹ, tôi là người Anh. Bạn cũng là người Anh phải không?',
        highlight: '也是 (yě shì - cũng là)',
        grammarLink: 'g3' // Phân biệt 不/没 & 也
      },
      {
        speaker: 'A: Tiểu Minh',
        hanzi: '我不是英国人，我是中国北京人。',
        pinyin: 'Wǒ bú shì Yīngguórén, wǒ shì Zhōngguó Běijīngrén.',
        meaning: 'Tôi không phải người Anh, tôi là người Bắc Kinh, Trung Quốc.',
        highlight: '北京 (Běijīng - Bắc Kinh)',
        grammarLink: 'g3'
      },
      {
        speaker: 'B: Tiểu Hoa',
        hanzi: '认识你很高兴！',
        pinyin: 'Rènshí nǐ hěn gāoxìng!',
        meaning: 'Rất vui được quen biết bạn!',
        highlight: '认识 (rènshí - quen biết, nhận biết)',
        grammarLink: ''
      },
      {
        speaker: 'A: Tiểu Minh',
        hanzi: '认识你我也很高兴！你学习汉语多久了？',
        pinyin: 'Rènshí nǐ wǒ yě hěn gāoxìng! Nǐ xuéxí Hànyǔ duōjiǔ le?',
        meaning: 'Quen biết bạn tôi cũng rất vui! Bạn học tiếng Trung được bao lâu rồi?',
        highlight: '多久 (duōjiǔ - bao lâu)',
        grammarLink: 'g1' // Trợ từ 了
      },
      {
        speaker: 'B: Tiểu Hoa',
        hanzi: '我学了三个月了，汉语很有意思，但是汉字有点儿难。',
        pinyin: 'Wǒ xuéle sān gè yuè le, Hànyǔ hěn yǒu yìsi, dànshì hànzì yǒudiǎnr nán.',
        meaning: 'Tôi học được ba tháng rồi, tiếng Trung rất thú vị, nhưng chữ Hán hơi khó một chút.',
        highlight: '有意思 (yǒu yìsi - thú vị)',
        grammarLink: 'g1'
      }
    ],
    vocabulary: [
      { word: '请问', pinyin: 'qǐngwèn', definition: 'xin hỏi' },
      { word: '名字', pinyin: 'míngzì', definition: 'tên' },
      { word: '英国', pinyin: 'Yīngguó', definition: 'nước Anh' },
      { word: '北京', pinyin: 'Běijīng', definition: 'Bắc Kinh' },
      { word: '认识', pinyin: 'rènshí', definition: 'quen biết' },
      { word: '有意思', pinyin: 'yǒu yìsi', definition: 'thú vị, có ý nghĩa' },
      { word: '有点儿', pinyin: 'yǒudiǎnr', definition: 'hơi hơi, một chút' }
    ]
  },
  {
    id: 'd2',
    title: 'Mua sắm & Hỏi giá cả tại cửa hàng',
    level: 'HSK 2',
    description: 'Tiểu Hoa vào một cửa hàng quần áo để mua một chiếc áo khoác mới.',
    topics: ['Mua sắm', 'Hỏi giá', 'Màu sắc'],
    lines: [
      {
        speaker: 'A: Nhân viên',
        hanzi: '欢迎光临！您想看看什么衣服？',
        pinyin: 'Huānyíng guānglín! Nín xiǎng kànkan shénme yīfú?',
        meaning: 'Chào mừng quý khách! Bạn muốn xem quần áo gì?',
        highlight: '欢迎光临 (huānyíng guānglín - chào mừng)',
        grammarLink: ''
      },
      {
        speaker: 'B: Tiểu Hoa',
        hanzi: '你好！我想买一件红色的外套。这件多少钱？',
        pinyin: 'Nǐ hǎo! Wǒ xiǎng mǎi yí jiàn hóngsè de wàitào. Zhè jiàn duōshǎo qián?',
        meaning: 'Xin chào! Tôi muốn mua một chiếc áo khoác màu đỏ. Chiếc này bao nhiêu tiền?',
        highlight: '外套 (wàitào - áo khoác ngoài)',
        grammarLink: 'g53' // Cấu trúc 是...的 / 的
      },
      {
        speaker: 'A: Nhân viên',
        hanzi: '这件外套是新来的，原价四百块，今天打折，三百二十块。',
        pinyin: 'Zhè jiàn wàitào shì xīn lái de, yuánjià sìbǎi kuài, jīntiān dǎzhé, sānbǎi èrshí kuài.',
        meaning: 'Chiếc áo khoác này là hàng mới về, giá gốc 400 tệ, hôm nay giảm giá còn 320 tệ.',
        highlight: '打折 (dǎzhé - giảm giá, chiết khấu)',
        grammarLink: 'g5' // Cấu trúc 是...的
      },
      {
        speaker: 'B: Tiểu Hoa',
        hanzi: '有点儿贵。比旁边那件黑色的贵很多吗？',
        pinyin: 'Yǒudiǎnr guì. Bǐ pángbiān nà jiàn hēisè de guì hěnduō ma?',
        meaning: 'Hơi đắt một chút. Có đắt hơn nhiều so với chiếc màu đen ở bên cạnh không?',
        highlight: '旁边 (pángbiān - bên cạnh)',
        grammarLink: 'g6' // Cấu trúc so sánh 比
      },
      {
        speaker: 'A: Nhân viên',
        hanzi: '黑色的那件比这件便宜五十块，但是这件质量更好。',
        pinyin: 'Hēisè de nà jiàn bǐ zhè jiàn piányi wǔshí kuài, dànshì zhè jiàn zhìliàng gèng hǎo.',
        meaning: 'Chiếc màu đen rẻ hơn chiếc này 50 tệ, nhưng chiếc này chất lượng tốt hơn.',
        highlight: '质量 (zhìliàng - chất lượng)',
        grammarLink: 'g6'
      },
      {
        speaker: 'B: Tiểu Hoa',
        hanzi: '我可以试一下吗？',
        pinyin: 'Wǒ kěyǐ shì yíxià ma?',
        meaning: 'Tôi có thể mặc thử một lát được không?',
        highlight: '试一下 (shì yíxià - thử một chút)',
        grammarLink: ''
      },
      {
        speaker: 'A: Nhân viên',
        hanzi: '当然可以，试衣间在里面。这件真适合您！',
        pinyin: 'Dāngrán kěyǐ, shìyījiān zài lǐmiàn. Zhè jiàn zhēn shìhé nín!',
        meaning: 'Tất nhiên là được, phòng thử đồ ở bên trong. Chiếc này thực sự rất hợp với bạn!',
        highlight: '适合 (shìhé - phù hợp, vừa vặn)',
        grammarLink: 'g8' // Cấu trúc với 真
      },
      {
        speaker: 'B: Tiểu Hoa',
        hanzi: '好的，我很喜欢，我买这件红色的。可以刷卡吗？',
        pinyin: 'Hǎo de, wǒ hěn xǐhuān, wǒ mǎi zhè jiàn hóngsè de. Kěyǐ shuākǎ ma?',
        meaning: 'Được rồi, tôi rất thích, tôi mua chiếc màu đỏ này. Có thể quẹt thẻ không?',
        highlight: '刷卡 (shuākǎ - quẹt thẻ)',
        grammarLink: ''
      },
      {
        speaker: 'A: Nhân viên',
        hanzi: '可以，没问题。请到这边付款。',
        pinyin: 'Kěyǐ, méi wèntí. Qǐng dào zhèbiān fùkuǎn.',
        meaning: 'Được chứ, không vấn đề gì. Xin mời qua bên này thanh toán.',
        highlight: '付款 (fùkuǎn - thanh toán tiền)',
        grammarLink: ''
      }
    ],
    vocabulary: [
      { word: '外套', pinyin: 'wàitào', definition: 'áo khoác ngoài' },
      { word: '打折', pinyin: 'dǎzhé', definition: 'giảm giá' },
      { word: '旁边', pinyin: 'pángbiān', definition: 'bên cạnh' },
      { word: '质量', pinyin: 'zhìliàng', definition: 'chất lượng' },
      { word: '试', pinyin: 'shì', definition: 'thử' },
      { word: '试衣间', pinyin: 'shìyījiān', definition: 'phòng thử đồ' },
      { word: '适合', pinyin: 'shìhé', definition: 'phù hợp, hợp với' },
      { word: '刷卡', pinyin: 'shuākǎ', definition: 'quẹt thẻ ngân hàng' }
    ]
  },
  {
    id: 'd3',
    title: 'Đặt bàn & Ăn uống tại Nhà hàng',
    level: 'HSK 3',
    description: 'Tiểu Minh đưa đối tác đi ăn tối tại một nhà hàng món ăn Tứ Xuyên nổi tiếng.',
    topics: ['Nhà hàng', 'Đặt món', 'Ăn uống'],
    lines: [
      {
        speaker: 'A: Phục vụ',
        hanzi: '晚上好！请问有预订吗？一共几位？',
        pinyin: 'Wǎnshàng hǎo! Qǐngwèn yǒu yùdìng ma? Yígòng jǐ wèi?',
        meaning: 'Chào buổi tối! Xin hỏi quý khách có đặt bàn trước không? Tổng cộng đi mấy người?',
        highlight: '预订 (yùdìng - đặt trước)',
        grammarLink: ''
      },
      {
        speaker: 'B: Tiểu Minh',
        hanzi: '有，我昨天预订了一个在窗户旁边的桌子。',
        pinyin: 'Yǒu, wǒ zuótiān yùdìngle yí gè zài chuānghu pángbiān de zhuōzi.',
        meaning: 'Có, hôm qua tôi đã đặt trước một bàn ở bên cạnh cửa sổ.',
        highlight: '窗户 (chuānghu - cửa sổ)',
        grammarLink: 'g1' // Đã hoàn thành (了)
      },
      {
        speaker: 'A: Phục vụ',
        hanzi: '好的，李先生是吧？请跟我来。这是菜单，请点菜。',
        pinyin: 'Hǎo de, Lǐ xiānshēng shì ba? Qǐng gēn wǒ lái. Zhè shì càidān, qǐng diǎncài.',
        meaning: 'Dạ vâng, anh Lý phải không ạ? Xin đi theo tôi. Đây là thực đơn, mời quý khách gọi món.',
        highlight: '菜单 (càidān - thực đơn)',
        grammarLink: ''
      },
      {
        speaker: 'B: Tiểu Minh',
        hanzi: '如果吃四川菜的话，必须点麻婆豆腐。你觉得呢？',
        pinyin: 'Rúguǒ chī Sìchuāncài dehuà, bìxū diǎn Mápó dòufu. Nǐ juéde ne?',
        meaning: 'Nếu ăn món Tứ Xuyên thì nhất định phải gọi Đậu phụ Ma Bà. Bạn thấy sao?',
        highlight: '必须 (bìxū - nhất định phải, bắt buộc)',
        grammarLink: 'g11' // Cấu trúc 如果...就...
      },
      {
        speaker: 'C: Đối tác',
        hanzi: '我都可以，不过我一点儿辣都不能吃。',
        pinyin: 'Wǒ dōu kěyǐ, búguò wǒ yìdiǎnr là dōu bù néng chī.',
        meaning: 'Tôi thế nào cũng được, có điều tôi không ăn cay được một chút nào cả.',
        highlight: '不过 (búguò - có điều, tuy nhiên)',
        grammarLink: 'g12' // Cấu trúc 一点儿也/都 + 不
      },
      {
        speaker: 'B: Tiểu Minh',
        hanzi: '别担心，我让服务员把所有菜都做成不辣的。',
        pinyin: 'Bié dānxīn, wǒ ràng fúwùyuán bǎ suǒyǒu cài dōu zuòchéng bú là de.',
        meaning: 'Đừng lo lắng, tôi sẽ bảo phục vụ làm tất cả món ăn thành không cay.',
        highlight: '别担心 (bié dānxīn - đừng lo lắng)',
        grammarLink: 'g9' // Cấu trúc câu chữ 把
      },
      {
        speaker: 'B: Tiểu Minh',
        hanzi: '服务员，请把这个麻婆豆腐和鱼香肉丝都做成不辣的。',
        pinyin: 'Fúwùyuán, qǐng bǎ zhège Mápó dòufu hé yúxiāng ròusī dōu zuòchéng bú là de.',
        meaning: 'Phục vụ ơi, vui lòng làm Đậu phụ Ma Bà và Thịt heo hương cá này thành không cay nhé.',
        highlight: '鱼香肉丝 (yúxiāng ròusī - thịt heo xào hương cá)',
        grammarLink: 'g9' // Cấu trúc câu chữ 把
      },
      {
        speaker: 'A: Phục vụ',
        hanzi: '好的，没问题。还要喝点儿什么吗？',
        pinyin: 'Hǎo de, méi wèntí. Hái yào hē diǎnr shénme ma?',
        meaning: 'Dạ được, không vấn đề gì ạ. Quý khách có muốn uống thêm đồ uống gì không?',
        highlight: '还要 (hái yào - còn muốn, cần thêm)',
        grammarLink: ''
      },
      {
        speaker: 'C: Đối tác',
        hanzi: '来一壶热茶吧，坐在这里看着外面的风景真舒服。',
        pinyin: 'Lái yì hú rèchá ba, zuò zài zhèlǐ kànzhe wàimiàn de fēngjǐng zhēn shūfu.',
        meaning: 'Cho một ấm trà nóng nhé, ngồi ở đây ngắm phong cảnh bên ngoài thật dễ chịu.',
        highlight: '风景 (fēngjǐng - phong cảnh, cảnh đẹp)',
        grammarLink: 'g10' // Cấu trúc câu tồn hiện 着
      }
    ],
    vocabulary: [
      { word: '预订', pinyin: 'yùdìng', definition: 'đặt trước (bàn, phòng)' },
      { word: '窗户', pinyin: 'chuānghu', definition: 'cửa sổ' },
      { word: '菜单', pinyin: 'càidān', definition: 'thực đơn, menu' },
      { word: '必须', pinyin: 'bìxū', definition: 'phải, bắt buộc phải' },
      { word: '不过', pinyin: 'búguò', definition: 'tuy nhiên, có điều' },
      { word: '所有', pinyin: 'suǒyǒu', definition: 'tất cả, sở hữu' },
      { word: '一壶', pinyin: 'yì hú', definition: 'một ấm, một bình' },
      { word: '风景', pinyin: 'fēngjǐng', definition: 'phong cảnh, cảnh đẹp' }
    ]
  }
];
