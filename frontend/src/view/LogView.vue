<script setup>
import { useErrorLog } from '@/store/errorLog'
import { useRouter } from 'vue-router'

const errorLog = useErrorLog()
const router = useRouter()

function formatDate(date) {
	const dateString = new Date(date)
  return `${ dateString.toLocaleDateString() }:${ dateString.toLocaleTimeString() }`
}
function goBack() {
	router.push({ name: 'Scanner' })
}

</script>
<template>
  <div class='table-wrapper'>
    <div class='page-header'>
      <span class='page-title'>Лог билетов не прошедших сканирование:</span>
      <el-button
        class='back-button'
        type='primary'
        :plain='true'
        @click='goBack'
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" xml:space="preserve" style='margin-right: 5px;'>
        <g style="stroke: none; stroke-width: 0; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: none; fill-rule: nonzero; opacity: 1;" transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)" >
	        <path d="M 31.655 13.285 c 0.598 0 1.196 0.228 1.651 0.683 l 9.44 9.44 c 0.441 0.441 0.684 1.027 0.684 1.651 s -0.242 1.21 -0.684 1.651 l -9.277 9.277 l 54.195 0 c 1.288 0 2.335 1.048 2.335 2.335 v 13.351 c 0 1.288 -1.048 2.335 -2.335 2.335 l -54.195 0 l 9.277 9.278 c 0.441 0.441 0.684 1.027 0.684 1.651 c 0 0.624 -0.242 1.21 -0.684 1.651 l -9.44 9.44 c -0.91 0.911 -2.393 0.911 -3.303 0 L 0.674 46.701 c -0.459 -0.46 -0.697 -1.078 -0.672 -1.74 c -0.025 -0.585 0.213 -1.203 0.672 -1.663 l 29.33 -29.33 C 30.459 13.513 31.057 13.285 31.655 13.285 z M 87.664 52.01 c 0.185 0 0.335 -0.15 0.335 -0.335 V 38.323 c 0 -0.185 -0.15 -0.335 -0.335 -0.335 l -59.023 0 l 12.691 -12.691 c 0.131 -0.131 0.131 -0.344 0 -0.475 l -9.44 -9.44 c -0.131 -0.131 -0.344 -0.131 -0.475 0 L 2.089 44.711 C 2.011 44.789 1.997 44.89 2 44.961 c -0.003 0.147 0.011 0.249 0.09 0.327 l 29.328 29.328 c 0.131 0.131 0.344 0.131 0.475 0 l 9.44 -9.44 c 0.131 -0.131 0.131 -0.343 0 -0.474 L 28.641 52.01 L 87.664 52.01 z" style="stroke: none; stroke-width: 1; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(0,0,0); fill-rule: nonzero; opacity: 1;" transform=" matrix(1 0 0 1 0 0) " stroke-linecap="round" />
        </g>
      </svg>
        <span>Назад</span>
      </el-button>
    </div>
    <el-table
      :data='errorLog.getLog'
      :highlight-current-row='true'
      :border='true'
      :default-sort = '{
				prop: "ErrorTime",
				order: "descending"
      }'
    >
      <el-table-column prop='TicketNumber' header-align='center' align='center' min-width='100px'>
        <template #header>
          Номер <br /> билета
        </template>
      </el-table-column>
      <el-table-column prop='ErrorTime' header-align='center' align='center' min-width='160px' :sortable='true'>
        <template #header>
          Время <br /> проверки
        </template>
        <template #default='scope'>
          {{ formatDate(scope.row.ErrorTime) }}
        </template>
      </el-table-column>
      <el-table-column prop='EventName' header-align='center' align='center' min-width='150px'>
        <template #header>
          Наименование <br /> мероприятия
        </template>
      </el-table-column>
      <el-table-column prop='StatusText' header-align='center' min-width='150px'>
        <template #header>
          Результат <br /> проверки
        </template>
      </el-table-column>
      <el-table-column label='Статус ответа' prop='Result' header-align='center' align='center' width='80px'>
        <template #header>
          Статус <br /> ответа
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style>
.table-wrapper {
  display: flex;
  flex-direction: column;

  padding: 10px;

  height:100%;
}
.table-wrapper::-webkit-scrollbar {
  height: 8px;
  width: 8px;
  background: transparent;
}
.table-wrapper::-webkit-scrollbar-track {
  background: rgb(225, 223, 221);
}
.table-wrapper::-webkit-scrollbar-thumb {
  border-radius: 20px;
  background: rgb(138, 136, 134);
}
.el-table .cell {
  word-break: break-word !important;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  width: 100%;
  margin-bottom: 10px;
}
.page-title {
  font-size: 16px;
  font-weight: bold;
}
</style>