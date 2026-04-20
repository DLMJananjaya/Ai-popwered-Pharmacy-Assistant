import React from 'react'

// 1. Define the expected shape of your props
interface PageProps {
  params: {
    alwaysShow: string[]; 
  }
}

// 2. Apply the interface to the component
function page({ params }: PageProps) {
  console.log(params)
  
  return (
    <>
    <div className="text-black">
      <h1 align="center">Please check Your URL</h1>
      
      
      <ul>
        {/* 3. Added optional chaining (?.) and the map index */}
        {params?.alwaysShow?.map((item) => {
          return ( 
            // 4. Added the required unique key prop
            <li>
              {item}
            </li>
          )
        })}
      </ul>
      </div>
    </>
  )
}

export default page;