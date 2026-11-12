/* 📄 Ochiq huquqiy sahifalar matni (/privacy va /delete-account) — uch tilda. Google Play talabi: maxfiylik siyosati
   va hisobni o'chirish yo'riqnomasi ilovaga kirmasdan ham ochilishi kerak. Operator nomi va email — administrator
   «Sayt boshqaruvi → 📱 Ilova»da kiritadi (lib/server/app-store.ts). */

export type LegalLang = 'uz' | 'ru' | 'en';
export const LEGAL_LANGS: LegalLang[] = ['uz', 'ru', 'en'];
export const legalLang = (v: unknown): LegalLang => (v === 'ru' || v === 'en' ? v : 'uz');
export const LEGAL_UPDATED = '2026-11-12';
export const APP_NAME = 'Tadbirkorlik asoslari';

/** p — ro'yxatdan oldingi matn, ul — ro'yxat, note — ro'yxatdan keyingi izoh */
export type LegalSection = { h: string; p?: string[]; ul?: string[]; note?: string[] };
export type LegalDoc = { title: string; lead: string; updated: string; sections: LegalSection[] };
type Who = { operator: string; email: string };

const contact = (w: Who, l: LegalLang) => {
  const chat =
    l === 'uz'
      ? 'ilova ichidagi «Talabalar chati → Adminga xabar» bo‘limi'
      : l === 'ru'
        ? 'раздел «Чат студентов → Написать админу» в приложении'
        : 'the “Class chat → Message the admin” section inside the app';
  return w.email ? w.email + (l === 'uz' ? ' yoki ' : l === 'ru' ? ' или ' : ' or ') + chat : chat;
};
const operator = (w: Who, l: LegalLang) =>
  w.operator ||
  (l === 'uz'
    ? '«Tadbirkorlik asoslari» platformasi ma’muriyati'
    : l === 'ru'
      ? 'администрация платформы «Tadbirkorlik asoslari»'
      : 'the administration of the “Tadbirkorlik asoslari” platform');

export function privacyDoc(l: LegalLang, w: Who): LegalDoc {
  const op = operator(w, l),
    c = contact(w, l);
  if (l === 'ru')
    return {
      title: 'Политика конфиденциальности',
      lead: `Эта политика объясняет, какие данные собирает учебная платформа «${APP_NAME}» (сайт и приложение для Android), зачем они нужны и как их удалить.`,
      updated: 'Обновлено: ' + LEGAL_UPDATED,
      sections: [
        {
          h: '1. Кто отвечает за данные',
          p: [
            `Оператор платформы: ${op}. По вопросам о данных пишите: ${c}.`,
            'Платформа предназначена для студентов и других учащихся старше 16 лет. Мы не собираем данные детей младше 13 лет намеренно.',
          ],
        },
        {
          h: '2. Какие данные мы собираем',
          ul: [
            'Данные аккаунта: имя и фамилия, учебная группа (для студентов университета), адрес электронной почты (если вы регистрируетесь по email) и пароль — пароль хранится только в зашифрованном (хешированном) виде.',
            'Учебные данные: какие темы и слайды вы прочитали, время чтения, ответы на тесты и задания, баллы, оценки, достижения и место в рейтинге.',
            'Содержимое, которое вы создаёте: сообщения в чате группы и в переписке с администратором, загруженные работы (например, логотип для задания), выбранный аватар.',
            'Игры и живой тест: участие, ответы и результаты.',
            'Уведомления: если вы включили уведомления — технический адрес вашего браузера или устройства (push-подписка), чтобы доставлять сообщения.',
            'Технические данные: время входа и сведения, необходимые для защиты аккаунта. На устройстве хранятся настройки (язык, тема, прочитанные объявления).',
          ],
          note: [
            'Мы не запрашиваем доступ к камере, микрофону, контактам или геолокации. В приложении нет рекламных SDK и сторонних счётчиков аналитики.',
          ],
        },
        {
          h: '3. Зачем нужны данные',
          ul: [
            'чтобы вы могли входить в аккаунт и продолжать обучение с того же места;',
            'чтобы преподаватель видел успеваемость и выставлял оценки;',
            'чтобы показывать рейтинг (имя, группа и баллы видны другим пользователям; показ в рейтинге платформы можно отключить в профиле);',
            'чтобы работали чат, игры и живой тест;',
            'чтобы присылать уведомления, которые вы включили;',
            'чтобы защищать платформу от злоупотреблений.',
          ],
        },
        {
          h: '4. Кому передаются данные',
          p: [
            'Мы не продаём ваши данные и не передаём их рекламодателям. Данные обрабатывают только поставщики, без которых платформа не работает:',
          ],
          ul: [
            'Google Firebase (Google LLC) — вход в аккаунт и хранение данных;',
            'Vercel Inc. — размещение сайта;',
            'службы push-уведомлений вашего браузера или устройства (Google, Apple, Mozilla, Microsoft) — доставка уведомлений;',
            'YouTube (Google LLC) — если вы открываете встроенное учебное видео.',
          ],
        },
        {
          h: '5. Защита и срок хранения',
          p: [
            'Данные передаются по защищённому соединению (HTTPS). Доступ к ним имеют только администратор и преподаватели платформы.',
            'Данные хранятся, пока существует ваш аккаунт. Сообщения чата удаляются автоматически через 7 дней, видео в чате — через 1 день. После удаления аккаунта личные данные удаляются в течение 30 дней. Итоговые оценки студентов университета могут сохраняться у преподавателя как учебная документация.',
          ],
        },
        {
          h: '6. Ваши права',
          ul: [
            'посмотреть и изменить свои данные в разделе «Профиль»;',
            'отключить уведомления и показ в рейтинге платформы;',
            'удалить аккаунт и данные: «Профиль → Удалить аккаунт» или страница /delete-account;',
            `задать вопрос или попросить копию данных: ${c}.`,
          ],
        },
        {
          h: '7. Изменения',
          p: [
            'Если политика изменится, новая версия появится на этой странице с новой датой. О существенных изменениях мы сообщим объявлением в приложении.',
          ],
        },
      ],
    };
  if (l === 'en')
    return {
      title: 'Privacy Policy',
      lead: `This policy explains what data the “${APP_NAME}” learning platform (website and Android app) collects, why it is needed and how to delete it.`,
      updated: 'Updated: ' + LEGAL_UPDATED,
      sections: [
        {
          h: '1. Who is responsible',
          p: [
            `Platform operator: ${op}. For questions about your data, write to: ${c}.`,
            'The platform is intended for university students and other learners aged 16 and over. We do not knowingly collect data from children under 13.',
          ],
        },
        {
          h: '2. What we collect',
          ul: [
            'Account data: first and last name, study group (for university students), email address (if you register by email) and password — the password is stored only in hashed form.',
            'Learning data: topics and slides you read, reading time, answers to tests and assignments, points, grades, achievements and leaderboard position.',
            'Content you create: messages in the group chat and in the conversation with the administrator, uploaded work (for example a logo for an assignment), your chosen avatar.',
            'Games and the live quiz: participation, answers and results.',
            'Notifications: if you turn notifications on — the technical address of your browser or device (push subscription) used to deliver messages.',
            'Technical data: sign-in time and information needed to protect the account. Settings (language, theme, announcements you have read) are stored on your device.',
          ],
          note: [
            'We do not request access to your camera, microphone, contacts or location. The app contains no advertising SDKs and no third-party analytics trackers.',
          ],
        },
        {
          h: '3. Why we use it',
          ul: [
            'to let you sign in and continue learning where you left off;',
            'to let the teacher see progress and give grades;',
            'to show leaderboards (name, group and points are visible to other users; you can hide yourself from the platform leaderboard in your profile);',
            'to run the chat, games and the live quiz;',
            'to send the notifications you turned on;',
            'to protect the platform from abuse.',
          ],
        },
        {
          h: '4. Who receives data',
          p: [
            'We do not sell your data and do not share it with advertisers. Data is processed only by the providers the platform needs to work:',
          ],
          ul: [
            'Google Firebase (Google LLC) — sign-in and data storage;',
            'Vercel Inc. — website hosting;',
            'the push services of your browser or device (Google, Apple, Mozilla, Microsoft) — delivering notifications;',
            'YouTube (Google LLC) — when you open an embedded lesson video.',
          ],
        },
        {
          h: '5. Security and retention',
          p: [
            'Data is transferred over an encrypted connection (HTTPS). Only the platform administrator and teachers have access to it.',
            'Data is kept while your account exists. Chat messages are deleted automatically after 7 days and chat videos after 1 day. After account deletion, personal data is removed within 30 days. Final grades of university students may be kept by the teacher as academic records.',
          ],
        },
        {
          h: '6. Your rights',
          ul: [
            'view and change your data in “Profile”;',
            'turn off notifications and hide yourself from the platform leaderboard;',
            'delete your account and data: “Profile → Delete account” or the /delete-account page;',
            `ask a question or request a copy of your data: ${c}.`,
          ],
        },
        {
          h: '7. Changes',
          p: [
            'If this policy changes, the new version will appear on this page with a new date. We will announce significant changes inside the app.',
          ],
        },
      ],
    };
  return {
    title: 'Maxfiylik siyosati',
    lead: `Ushbu siyosat «${APP_NAME}» o‘quv platformasi (sayt va Android ilovasi) qanday ma’lumot yig‘ishi, nima uchun kerakligi va uni qanday o‘chirish mumkinligini tushuntiradi.`,
    updated: 'Yangilangan: ' + LEGAL_UPDATED,
    sections: [
      {
        h: '1. Ma’lumotlar uchun kim javobgar',
        p: [
          `Platforma operatori: ${op}. Ma’lumotlaringiz bo‘yicha savollar uchun: ${c}.`,
          'Platforma universitet talabalari va 16 yoshdan katta boshqa o‘quvchilar uchun mo‘ljallangan. 13 yoshgacha bo‘lgan bolalar ma’lumotini ataylab yig‘maymiz.',
        ],
      },
      {
        h: '2. Qanday ma’lumot yig‘iladi',
        ul: [
          'Hisob ma’lumotlari: ism va familiya, o‘quv guruhi (universitet talabalari uchun), email manzil (email orqali ro‘yxatdan o‘tsangiz) va parol — parol faqat shifrlangan (xeshlangan) ko‘rinishda saqlanadi.',
          'O‘qish ma’lumotlari: qaysi mavzu va slaydlarni o‘qiganingiz, o‘qish vaqti, test va topshiriq javoblari, ballar, baholar, yutuqlar va reytingdagi o‘rningiz.',
          'Siz yaratgan kontent: guruh chatidagi va administrator bilan yozishmadagi xabarlar, yuklagan ishlaringiz (masalan, topshiriq uchun logotip), tanlagan avataringiz.',
          'O‘yinlar va jonli test: ishtirok, javoblar va natijalar.',
          'Bildirishnomalar: yoqqan bo‘lsangiz — xabar yetkazish uchun brauzeringiz yoki qurilmangizning texnik manzili (push obunasi).',
          'Texnik ma’lumotlar: kirish vaqti va hisobni himoya qilish uchun zarur ma’lumotlar. Sozlamalar (til, mavzu, o‘qilgan e’lonlar) qurilmangizning o‘zida saqlanadi.',
        ],
        note: [
          'Kamera, mikrofon, kontaktlar yoki joylashuvga ruxsat so‘ramaymiz. Ilovada reklama SDK’lari va begona tahlil (analitika) hisoblagichlari yo‘q.',
        ],
      },
      {
        h: '3. Ma’lumot nima uchun kerak',
        ul: [
          'hisobingizga kirishingiz va o‘qishni qolgan joyidan davom ettirishingiz uchun;',
          'o‘qituvchi o‘zlashtirishni ko‘rishi va baho qo‘yishi uchun;',
          'reytingni ko‘rsatish uchun (ism, guruh va ball boshqa foydalanuvchilarga ko‘rinadi; platforma reytingida ko‘rinishni profilda o‘chirib qo‘yish mumkin);',
          'chat, o‘yinlar va jonli test ishlashi uchun;',
          'o‘zingiz yoqqan bildirishnomalarni yuborish uchun;',
          'platformani suiiste’moldan himoya qilish uchun.',
        ],
      },
      {
        h: '4. Ma’lumot kimga beriladi',
        p: [
          'Ma’lumotlaringizni sotmaymiz va reklama beruvchilarga bermaymiz. Ularni faqat platforma ishlashi uchun zarur xizmatlar qayta ishlaydi:',
        ],
        ul: [
          'Google Firebase (Google LLC) — hisobga kirish va ma’lumotlarni saqlash;',
          'Vercel Inc. — saytni joylashtirish;',
          'brauzeringiz yoki qurilmangizning bildirishnoma xizmatlari (Google, Apple, Mozilla, Microsoft) — bildirishnomalarni yetkazish;',
          'YouTube (Google LLC) — sayt ichidagi dars videosini ochganingizda.',
        ],
      },
      {
        h: '5. Himoya va saqlash muddati',
        p: [
          'Ma’lumotlar himoyalangan aloqa (HTTPS) orqali uzatiladi. Ularni faqat platforma administratori va o‘qituvchilari ko‘ra oladi.',
          'Ma’lumotlar hisobingiz mavjud bo‘lgan davrda saqlanadi. Chat xabarlari 7 kundan keyin, chatdagi videolar 1 kundan keyin avtomatik o‘chadi. Hisob o‘chirilgach, shaxsiy ma’lumotlar 30 kun ichida o‘chiriladi. Universitet talabalarining yakuniy baholari o‘quv hujjati sifatida o‘qituvchida saqlanishi mumkin.',
        ],
      },
      {
        h: '6. Sizning huquqlaringiz',
        ul: [
          '«Profil» bo‘limida ma’lumotlaringizni ko‘rish va o‘zgartirish;',
          'bildirishnomalarni va platforma reytingida ko‘rinishni o‘chirish;',
          'hisob va ma’lumotlarni o‘chirish: «Profil → Hisobni o‘chirish» yoki /delete-account sahifasi;',
          `savol berish yoki ma’lumotlaringiz nusxasini so‘rash: ${c}.`,
        ],
      },
      {
        h: '7. O‘zgarishlar',
        p: [
          'Siyosat o‘zgarsa, yangi tahriri shu sahifada yangi sana bilan chiqadi. Muhim o‘zgarishlar haqida ilova ichida e’lon beramiz.',
        ],
      },
    ],
  };
}

export function deleteDoc(l: LegalLang, w: Who): LegalDoc {
  const c = contact(w, l);
  if (l === 'ru')
    return {
      title: 'Удаление аккаунта и данных',
      lead: `Здесь описано, как удалить аккаунт на платформе «${APP_NAME}» и связанные с ним данные.`,
      updated: 'Обновлено: ' + LEGAL_UPDATED,
      sections: [
        {
          h: 'Как удалить аккаунт',
          ul: [
            'Откройте приложение или сайт и войдите в аккаунт.',
            'Перейдите в «Профиль» (нажмите на своё имя в правом верхнем углу).',
            'Внизу страницы нажмите «Удалить аккаунт», при желании укажите причину и подтвердите.',
            'Запрос попадёт администратору. Аккаунт и данные удаляются в течение 30 дней; до этого запрос можно отменить в том же разделе.',
          ],
        },
        {
          h: 'Если вы не можете войти',
          p: [
            `Напишите: ${c}. Укажите имя, фамилию и группу (или email аккаунта) — мы удалим аккаунт после проверки, что запрос отправили именно вы.`,
          ],
        },
        {
          h: 'Что удаляется',
          ul: [
            'аккаунт и данные для входа;',
            'имя, фамилия, группа и email;',
            'история чтения, ответы на тесты, баллы, достижения и место в рейтинге;',
            'переписка с администратором, выбранный аватар, подписки на уведомления.',
          ],
        },
        {
          h: 'Что может сохраниться',
          ul: [
            'сообщения в чате группы — удаляются автоматически через 7 дней после отправки;',
            'итоговые оценки студентов университета — могут храниться у преподавателя как учебная документация;',
            'запись в журнале безопасности о том, что аккаунт был удалён (без личных данных).',
          ],
        },
      ],
    };
  if (l === 'en')
    return {
      title: 'Delete your account and data',
      lead: `This page explains how to delete your “${APP_NAME}” account and the data linked to it.`,
      updated: 'Updated: ' + LEGAL_UPDATED,
      sections: [
        {
          h: 'How to delete your account',
          ul: [
            'Open the app or the website and sign in.',
            'Go to “Profile” (tap your name in the top right corner).',
            'At the bottom of the page press “Delete account”, optionally give a reason, and confirm.',
            'The request goes to the administrator. The account and data are deleted within 30 days; until then you can cancel the request in the same place.',
          ],
        },
        {
          h: 'If you cannot sign in',
          p: [
            `Write to: ${c}. Give your first name, last name and group (or the account email) — we will delete the account after checking that the request really comes from you.`,
          ],
        },
        {
          h: 'What is deleted',
          ul: [
            'the account and sign-in details;',
            'first name, last name, group and email;',
            'reading history, test answers, points, achievements and leaderboard position;',
            'the conversation with the administrator, your chosen avatar, notification subscriptions.',
          ],
        },
        {
          h: 'What may be kept',
          ul: [
            'messages in the group chat — deleted automatically 7 days after they were sent;',
            'final grades of university students — may be kept by the teacher as academic records;',
            'a security log entry saying that the account was deleted (no personal data).',
          ],
        },
      ],
    };
  return {
    title: 'Hisob va ma’lumotlarni o‘chirish',
    lead: `Bu sahifada «${APP_NAME}» platformasidagi hisobingizni va unga bog‘liq ma’lumotlarni qanday o‘chirish tushuntirilgan.`,
    updated: 'Yangilangan: ' + LEGAL_UPDATED,
    sections: [
      {
        h: 'Hisobni qanday o‘chirish mumkin',
        ul: [
          'Ilova yoki saytni oching va hisobingizga kiring.',
          '«Profil» bo‘limiga o‘ting (o‘ng yuqoridagi ismingizni bosing).',
          'Sahifa pastidagi «Hisobni o‘chirish» tugmasini bosing, xohlasangiz sababini yozing va tasdiqlang.',
          'So‘rov administratorga boradi. Hisob va ma’lumotlar 30 kun ichida o‘chiriladi; ungacha so‘rovni o‘sha joyda bekor qilish mumkin.',
        ],
      },
      {
        h: 'Hisobga kira olmasangiz',
        p: [
          `Bizga yozing: ${c}. Ism, familiya va guruhingizni (yoki hisob emailini) ko‘rsating — so‘rov aynan sizdan ekanini tekshirgach, hisobni o‘chiramiz.`,
        ],
      },
      {
        h: 'Nima o‘chiriladi',
        ul: [
          'hisob va kirish ma’lumotlari;',
          'ism, familiya, guruh va email;',
          'o‘qish tarixi, test javoblari, ballar, yutuqlar va reytingdagi o‘rin;',
          'administrator bilan yozishma, tanlangan avatar, bildirishnoma obunalari.',
        ],
      },
      {
        h: 'Nima saqlanib qolishi mumkin',
        ul: [
          'guruh chatidagi xabarlar — yuborilganidan 7 kun o‘tib avtomatik o‘chadi;',
          'universitet talabalarining yakuniy baholari — o‘quv hujjati sifatida o‘qituvchida saqlanishi mumkin;',
          'xavfsizlik jurnalidagi «hisob o‘chirildi» degan yozuv (shaxsiy ma’lumotsiz).',
        ],
      },
    ],
  };
}
