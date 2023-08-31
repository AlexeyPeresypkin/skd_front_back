<script setup>
import { ref, reactive } from 'vue'

import { useRouter } from 'vue-router'
import { useStore } from '@/store/store'

const form = ref(null)
const formData = reactive({
  login: '',
  password: '',
  loading: false
})
const formDataRules = []

const store = useStore()
const router = useRouter()

async function submitForm() {
  form.value.validate(async(valid) => {
    if(!valid) return
    formData.loading = true

    try {
      const res = await store.axios.post('/auth/sign-in', {
        username: formData.login,
        password: formData.password
      })

      if (res.data && Object.hasOwn(res.data, 'access_token')) {
        store.setToken(res.data.access_token)
      }
      await router.push('/scanner')
      formData.loading = false
    } catch(e) {
      formData.loading = false
      console.log('view || LoginView.vue || submitForm, error => ', e)
    }
  })
}
</script>

<template>
  <div class='content-wrapper'>
    <div class='form-wrapper'>
      <div class='title'>
        <span class='title_1'>ProfTicket</span>
        <span class='title_2'>Система контроля доступа</span>
      </div>
      <el-form
          class='form'
          ref='form'
          :model='formData'
          :rules='formDataRules'
          @submit.prevent='submitForm()'
      >
        <el-form-item
            prop='login'
        >
          <el-input
              placeholder='Логин'
              v-model='formData.login'
          />
        </el-form-item>
        <el-form-item
            prop='password'
        >
          <el-input
              type='password'
              placeholder='Пароль'
              v-model='formData.password'
              :show-password='true'
          />
        </el-form-item>
        <el-form-item>
          <el-button
              class='login-button'
              type='primary'
              native-type='submit'
          >
            <span class='login-button' v-if='formData.loading'>
              <font-awesome-icon icon='fa-solid fa-spinner' :spin='true' size='1x' pull='left' />
              <span>Подождите</span>
            </span>
            <span class='login-button' v-else>
              Войти
            </span>
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.content-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  width: 100%;
  height: 100%;

  background: teal;
}
.form-wrapper {
  padding: 18px 18px 0;
  max-width: 300px;
  width: 100%;

  border-radius: 18px;
  background: white;
}
.title {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  margin-bottom: 15px;
}
.title_1 {
  font-size: 20px;
  font-family: Aller, sans-serif;
}
.title_2 {
  font-size: 16px;
  font-family: Aller, sans-serif;
}
.form {
  max-width: 300px;
  width: 100%;
}
.login-button {
  display: flex;
  align-items: center;

  margin: auto;
  max-width: 150px;
  width: 100%;
}
</style>